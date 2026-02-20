#!/usr/bin/env bun
/**
 * build-metadata
 *
 * Merges per-repository JSONL facet files (meta-{repo}.jsonl) into the
 * canonical metadata.json configuration.
 *
 * Each JSONL line is:
 *   {"facet":"structure|framework|convention|moduleInference|entryPoint|internalDep|note",...}
 *
 * Output:
 *   .riviere/config/metadata.json
 *
 * Exit codes:
 *   0 - merge completed successfully
 *   1 - invalid usage or filesystem error
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RepositoryEntry {
  name: string;
  root: string;
  sourceDirs: string[];
  testDirs: string[];
}

interface FrameworkEntry {
  category: string;
  name: string;
  version: string;
  repositories: string[];
}

interface ConventionEntry {
  kind: string;
  pattern: string;
  example?: string;
}

interface ModuleInferenceEntry {
  priority: number;
  signal: string;
  construct: string;
  extraction?: string;
  confidence: string;
}

interface EntryPointEntry {
  type: string;
  location: string;
  pattern: string;
  repository: string;
}

interface MetadataOutput {
  version: string;
  repositories: RepositoryEntry[];
  frameworks: FrameworkEntry[];
  conventions: {
    global: ConventionEntry[];
    overrides: Record<string, ConventionEntry[]>;
  };
  moduleInference: {
    global: ModuleInferenceEntry[];
    overrides: Record<string, ModuleInferenceEntry[]>;
  };
  entryPoints: EntryPointEntry[];
}

// ─── Help ────────────────────────────────────────────────────────────────────

const HELP = `
build-metadata

Merge per-repository JSONL facet files into metadata.json.

USAGE
  bun tools/build-metadata.ts [options]

OPTIONS
  --work-dir <path>        Directory containing meta-*.jsonl files (default: .riviere/work)
  --config-dir <path>      Output directory for metadata.json (default: .riviere/config)
  --project-root <path>    Resolve .riviere/ paths relative to this directory (default: cwd)
  --dry-run                Show what would be produced without writing
  --help, -h               Show this help
`.trim();

// ─── Arg helpers ─────────────────────────────────────────────────────────────

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

// ─── JSONL parser ────────────────────────────────────────────────────────────

function parseJsonlFile(filePath: string): Record<string, unknown>[] {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n").filter((l) => l.trim());
  const entries: Record<string, unknown>[] = [];

  for (const line of lines) {
    try {
      entries.push(JSON.parse(line));
    } catch {
      // Skip malformed lines
    }
  }

  return entries;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  if (hasFlag("--help") || hasFlag("-h")) {
    console.log(HELP);
    return;
  }

  const PROJECT_ROOT = resolve(argValue("--project-root") ?? ".");

  const workDir = argValue("--work-dir")
    ? resolve(argValue("--work-dir")!)
    : resolve(PROJECT_ROOT, ".riviere/work");
  const configDir = argValue("--config-dir")
    ? resolve(argValue("--config-dir")!)
    : resolve(PROJECT_ROOT, ".riviere/config");
  const dryRun = hasFlag("--dry-run");

  if (!existsSync(workDir)) {
    console.error(`Work directory not found: ${workDir}`);
    process.exit(1);
  }

  // Discover meta JSONL files
  const allFiles = readdirSync(workDir);
  const metaFiles = allFiles.filter((f) => /^meta-.*\.jsonl$/.test(f)).sort();

  if (metaFiles.length === 0) {
    console.log(`No meta files found in ${workDir} (expected meta-*.jsonl)`);
    return;
  }

  console.log(`Reading ${metaFiles.length} JSONL meta file(s)...`);

  // Collect all facets across repos
  const allFacets: Record<string, unknown>[] = [];

  for (const file of metaFiles) {
    const repoMatch = file.match(/^meta-(.+)\.jsonl$/);
    if (!repoMatch) continue;
    const repoName = repoMatch[1];

    const fullPath = join(workDir, file);
    const facets = parseJsonlFile(fullPath);

    allFacets.push(...facets);
    console.log(`  ${file}: ${facets.length} facet(s)`);
  }

  // Build output structure
  const output: MetadataOutput = {
    version: "1.0",
    repositories: [],
    frameworks: [],
    conventions: { global: [], overrides: {} },
    moduleInference: { global: [], overrides: {} },
    entryPoints: [],
  };

  // Group facets by type
  const structureFacets = allFacets.filter((f) => f.facet === "structure");
  const frameworkFacets = allFacets.filter((f) => f.facet === "framework");
  const conventionFacets = allFacets.filter((f) => f.facet === "convention");
  const moduleInferenceFacets = allFacets.filter((f) => f.facet === "moduleInference");
  const entryPointFacets = allFacets.filter((f) => f.facet === "entryPoint");

  // 1. Repositories
  for (const s of structureFacets) {
    output.repositories.push({
      name: String(s.repo ?? ""),
      root: String(s.root ?? ""),
      sourceDirs: Array.isArray(s.sourceDirs) ? s.sourceDirs.map(String) : [],
      testDirs: Array.isArray(s.testDirs) ? s.testDirs.map(String) : [],
    });
  }

  // 2. Frameworks — deduplicate by (category, name), merge repositories
  const fwKey = (f: Record<string, unknown>) =>
    `${String(f.category ?? "").toLowerCase()}::${String(f.name ?? "").toLowerCase()}`;
  const fwMap = new Map<string, FrameworkEntry>();

  for (const f of frameworkFacets) {
    const key = fwKey(f);
    const repo = String(f.repo ?? "");
    const existing = fwMap.get(key);
    if (existing) {
      if (!existing.repositories.includes(repo)) {
        existing.repositories.push(repo);
      }
      // Keep the most specific version
      if (!existing.version && f.version) {
        existing.version = String(f.version);
      }
    } else {
      fwMap.set(key, {
        category: String(f.category ?? ""),
        name: String(f.name ?? ""),
        version: String(f.version ?? ""),
        repositories: [repo],
      });
    }
  }
  output.frameworks = [...fwMap.values()];

  // 3. Conventions — find global patterns vs per-repo overrides
  const convByKind = new Map<string, Map<string, string[]>>();

  for (const c of conventionFacets) {
    const kind = String(c.kind ?? "");
    const pattern = String(c.pattern ?? "");
    const repo = String(c.repo ?? "");

    if (!convByKind.has(kind)) convByKind.set(kind, new Map());
    const patternMap = convByKind.get(kind)!;
    if (!patternMap.has(pattern)) patternMap.set(pattern, []);
    patternMap.get(pattern)!.push(repo);
  }

  for (const [kind, patternMap] of convByKind) {
    // Find the most common pattern (global)
    let maxCount = 0;
    let globalPattern = "";
    for (const [pattern, repos] of patternMap) {
      if (repos.length > maxCount) {
        maxCount = repos.length;
        globalPattern = pattern;
      }
    }

    const entry: ConventionEntry = { kind, pattern: globalPattern };
    // Include example if available from the original facet
    const exampleFacet = conventionFacets.find(
      (c) => String(c.kind) === kind && String(c.pattern) === globalPattern && c.example
    );
    if (exampleFacet) entry.example = String(exampleFacet.example);

    output.conventions.global.push(entry);

    // Overrides: patterns that differ from global
    for (const [pattern, repos] of patternMap) {
      if (pattern === globalPattern) continue;
      for (const repo of repos) {
        if (!output.conventions.overrides[repo]) {
          output.conventions.overrides[repo] = [];
        }
        const overrideEntry: ConventionEntry = { kind, pattern };
        const overrideExample = conventionFacets.find(
          (c) =>
            String(c.kind) === kind &&
            String(c.pattern) === pattern &&
            String(c.repo) === repo &&
            c.example
        );
        if (overrideExample) overrideEntry.example = String(overrideExample.example);
        output.conventions.overrides[repo].push(overrideEntry);
      }
    }
  }

  // 4. Module Inference — group by repo, find global vs overrides
  const miByRepo = new Map<string, ModuleInferenceEntry[]>();

  for (const m of moduleInferenceFacets) {
    const repo = String(m.repo ?? "");
    if (!miByRepo.has(repo)) miByRepo.set(repo, []);
    miByRepo.get(repo)!.push({
      priority: Number(m.priority ?? 0),
      signal: String(m.signal ?? ""),
      construct: String(m.construct ?? ""),
      extraction: m.extraction ? String(m.extraction) : undefined,
      confidence: String(m.confidence ?? ""),
    });
  }

  if (miByRepo.size === 1) {
    // Single repo — all rules are global
    output.moduleInference.global = [...miByRepo.values()][0];
  } else if (miByRepo.size > 1) {
    // Multiple repos — check if they share the same rules
    const serialized = new Map<string, string[]>();
    for (const [repo, rules] of miByRepo) {
      const key = JSON.stringify(rules.map((r) => ({ p: r.priority, s: r.signal, c: r.construct })));
      if (!serialized.has(key)) serialized.set(key, []);
      serialized.get(key)!.push(repo);
    }

    if (serialized.size === 1) {
      // All repos share the same rules — global
      output.moduleInference.global = [...miByRepo.values()][0];
    } else {
      // Find the most common set as global, rest as overrides
      let maxRepos = 0;
      let globalKey = "";
      for (const [key, repos] of serialized) {
        if (repos.length > maxRepos) {
          maxRepos = repos.length;
          globalKey = key;
        }
      }

      const globalRepo = serialized.get(globalKey)![0];
      output.moduleInference.global = miByRepo.get(globalRepo)!;

      for (const [key, repos] of serialized) {
        if (key === globalKey) continue;
        for (const repo of repos) {
          output.moduleInference.overrides[repo] = miByRepo.get(repo)!;
        }
      }
    }
  }

  // 5. Entry Points
  for (const ep of entryPointFacets) {
    output.entryPoints.push({
      type: String(ep.type ?? ""),
      location: String(ep.location ?? ""),
      pattern: String(ep.pattern ?? ""),
      repository: String(ep.repo ?? ep.repository ?? ""),
    });
  }

  if (dryRun) {
    console.log("\nDRY RUN -- would write metadata.json:\n");
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // Write output
  mkdirSync(configDir, { recursive: true });
  const outputPath = join(configDir, "metadata.json");
  writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\nMetadata merged successfully.`);
  console.log(`  Repositories: ${output.repositories.length}`);
  console.log(`  Frameworks:   ${output.frameworks.length}`);
  console.log(`  Conventions:  ${output.conventions.global.length} global, ${Object.keys(output.conventions.overrides).length} repo override(s)`);
  console.log(`  Entry points: ${output.entryPoints.length}`);
  console.log(`  Output:       ${outputPath}`);
}

main();
