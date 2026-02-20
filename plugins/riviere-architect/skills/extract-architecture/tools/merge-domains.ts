#!/usr/bin/env bun
/**
 * merge-domains
 *
 * Merges per-repository domain discovery files into the canonical domain
 * registry (.riviere/config/domains.json).
 *
 * Input: domains-{repo}.jsonl — JSONL with {"action":"new"|"addRepo",...} lines
 *
 * Three merge rules:
 *   1. New domain rows → appended to registry
 *   2. ADD: {repo} rows → repository added to existing domain's Repositories column
 *   3. Name collisions → flagged as conflicts (not auto-resolved)
 *
 * Optionally runs `npx riviere builder add-domain` for each new domain when
 * --add-to-graph is passed (use in Step 3 when graph already exists).
 *
 * Output:
 *   .riviere/config/domains.json
 *
 * Exit codes:
 *   0 - merge completed successfully (conflicts may exist but are reported)
 *   1 - invalid usage or filesystem error
 *   2 - conflicts detected that require user resolution
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { spawnSync } from "child_process";

interface DomainEntry {
  name: string;
  type: string;
  description: string;
  repositories: string[];
}

interface MergeReport {
  generatedAt: string;
  registryPath: string;
  filesProcessed: string[];
  added: DomainEntry[];
  updated: Array<{ name: string; addedRepos: string[] }>;
  conflicts: Array<{ name: string; sources: string[]; reason: string }>;
  addedToGraph: string[];
  graphErrors: Array<{ name: string; error: string }>;
}

const HELP = `
merge-domains

Merge per-repository domain discoveries into the canonical domain registry.

USAGE
  bun tools/merge-domains.ts [options]

OPTIONS
  --registry <path>        Path to canonical domains.json (default: .riviere/config/domains.json)
  --work-dir <path>        Directory containing domains-*.md files (default: .riviere/work)
  --project-root <path>    Resolve .riviere/ paths relative to this directory (default: cwd)
  --add-to-graph           Run add-domain CLI for each new domain (use when graph exists)
  --dry-run                Show what would change without writing
  --help, -h               Show this help
`.trim();

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/**
 * Parse a JSONL domains file (domains-{repo}.jsonl).
 * Each line is: {"action":"new","name":"...","type":"...","description":"...","repository":"..."}
 * or: {"action":"addRepo","name":"...","repository":"..."}
 */
function parseDomainsJsonl(content: string): DomainEntry[] {
  const entries: DomainEntry[] = [];
  const lines = content.split("\n").filter((l) => l.trim());

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.action === "new") {
        entries.push({
          name: String(obj.name ?? "").trim(),
          type: String(obj.type ?? "domain").trim(),
          description: String(obj.description ?? "").trim(),
          repositories: obj.repository
            ? [String(obj.repository).trim()]
            : (obj.repositories ?? []).map(String),
        });
      } else if (obj.action === "addRepo") {
        // Encode as an ADD entry for the existing merge logic
        entries.push({
          name: String(obj.name ?? "").trim(),
          type: "(exists)",
          description: "(exists)",
          repositories: [`ADD: ${String(obj.repository ?? "").trim()}`],
        });
      }
    } catch {
      // Skip malformed lines
    }
  }

  return entries;
}

/**
 * Compute Levenshtein distance for near-duplicate detection.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }

  return dp[m][n];
}

function main(): void {
  if (hasFlag("--help") || hasFlag("-h")) {
    console.log(HELP);
    return;
  }

  // --project-root: resolve .riviere/ paths relative to this directory (default: cwd)
  const PROJECT_ROOT = resolve(argValue("--project-root") ?? ".");

  const registryPath = argValue("--registry")
    ? resolve(argValue("--registry")!)
    : resolve(PROJECT_ROOT, ".riviere/config/domains.json");
  const workDir = argValue("--work-dir")
    ? resolve(argValue("--work-dir")!)
    : resolve(PROJECT_ROOT, ".riviere/work");
  const addToGraph = hasFlag("--add-to-graph");
  const dryRun = hasFlag("--dry-run");

  if (!existsSync(registryPath)) {
    console.error(`Domain registry not found: ${registryPath}`);
    process.exit(1);
  }

  if (!existsSync(workDir)) {
    console.error(`Work directory not found: ${workDir}`);
    process.exit(1);
  }

  // Read existing registry (JSON)
  const registryData = JSON.parse(readFileSync(registryPath, "utf8"));
  const registry: DomainEntry[] = (registryData.domains ?? []).map((d: Record<string, unknown>) => ({
    name: String(d.name ?? "").trim(),
    type: String(d.type ?? "domain").trim(),
    description: String(d.description ?? "").trim(),
    repositories: Array.isArray(d.repositories) ? d.repositories.map(String).filter(Boolean) : [],
  })).filter((d: DomainEntry) => d.name);
  const registryByName = new Map(registry.map((e) => [e.name.toLowerCase(), e]));

  // Find domain discovery JSONL files
  const allWorkFiles = readdirSync(workDir);
  const domainFiles = allWorkFiles.filter((f) => /^domains-.*\.jsonl$/.test(f)).sort();

  if (domainFiles.length === 0) {
    console.log(`No domain discovery files found in ${workDir} (pattern: domains-*.jsonl)`);
    return;
  }

  console.log(`Reading ${domainFiles.length} JSONL domain file(s)...`);

  const report: MergeReport = {
    generatedAt: new Date().toISOString(),
    registryPath,
    filesProcessed: domainFiles.map((f) => join(workDir, f)),
    added: [],
    updated: [],
    conflicts: [],
    addedToGraph: [],
    graphErrors: [],
  };

  // Collect all discovered entries
  for (const fileName of domainFiles) {
    const fullPath = join(workDir, fileName);
    const content = readFileSync(fullPath, "utf8");
    const entries = parseDomainsJsonl(content);

    for (const entry of entries) {
      const key = entry.name.toLowerCase();

      // Rule 2: ADD row — existing domain, add this repo
      if (entry.type === "(exists)" || entry.repositories.some((r) => r.startsWith("ADD:"))) {
        const existing = registryByName.get(key);
        if (existing) {
          const newRepos = entry.repositories
            .map((r) => r.replace(/^ADD:\s*/, "").trim())
            .filter((r) => r && !existing.repositories.includes(r));
          if (newRepos.length > 0) {
            existing.repositories.push(...newRepos);
            report.updated.push({ name: existing.name, addedRepos: newRepos });
          }
        } else {
          report.conflicts.push({
            name: entry.name,
            sources: [fileName],
            reason: `ADD row references domain "${entry.name}" which does not exist in registry`,
          });
        }
        continue;
      }

      // Rule 1 / Rule 3: New domain — check for exact match or near-duplicate
      if (registryByName.has(key)) {
        // Exact match — this is a duplicate, skip
        continue;
      }

      // Check for near-duplicates (Levenshtein distance <= 2)
      let nearMatch: string | null = null;
      for (const existingName of registryByName.keys()) {
        if (levenshtein(key, existingName) <= 2 && key !== existingName) {
          nearMatch = existingName;
          break;
        }
      }

      if (nearMatch) {
        report.conflicts.push({
          name: entry.name,
          sources: [fileName],
          reason: `Near-duplicate of existing domain "${registryByName.get(nearMatch)!.name}" (Levenshtein distance ≤ 2)`,
        });
        continue;
      }

      // Rule 1: Genuinely new domain
      registryByName.set(key, entry);
      registry.push(entry);
      report.added.push(entry);
    }
  }

  if (dryRun) {
    console.log("DRY RUN — no files modified\n");
    if (report.added.length > 0) {
      console.log(`Would add ${report.added.length} domain(s):`);
      for (const d of report.added) console.log(`  + ${d.name} (${d.type})`);
    }
    if (report.updated.length > 0) {
      console.log(`Would update ${report.updated.length} domain(s):`);
      for (const u of report.updated) console.log(`  ~ ${u.name}: +${u.addedRepos.join(", ")}`);
    }
    if (report.conflicts.length > 0) {
      console.log(`Conflicts requiring resolution: ${report.conflicts.length}`);
      for (const c of report.conflicts) console.log(`  ! ${c.name}: ${c.reason}`);
    }
    return;
  }

  // Write updated registry
  const domainsJson = {
    version: "1.0",
    domains: registry.map((d) => ({
      name: d.name,
      type: d.type,
      description: d.description,
      repositories: d.repositories,
    })),
  };
  writeFileSync(registryPath, JSON.stringify(domainsJson, null, 2));

  // Optionally add new domains to graph
  if (addToGraph) {
    for (const domain of report.added) {
      const args = [
        "riviere", "builder", "add-domain",
        "--name", domain.name,
        "--system-type", domain.type,
        "--description", domain.description,
      ];

      const res = spawnSync("npx", args, { encoding: "utf8" });
      if ((res.status ?? 1) === 0) {
        report.addedToGraph.push(domain.name);
      } else {
        report.graphErrors.push({
          name: domain.name,
          error: (res.stderr ?? "unknown error").trim(),
        });
      }
    }
  }

  // Write report
  mkdirSync(workDir, { recursive: true });
  const reportPath = join(workDir, "domain-merge-report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Summary
  console.log(`Processed ${domainFiles.length} file(s).`);
  if (report.added.length > 0) {
    console.log(`Added ${report.added.length} domain(s): ${report.added.map((d) => d.name).join(", ")}`);
  }
  if (report.updated.length > 0) {
    console.log(`Updated ${report.updated.length} domain(s): ${report.updated.map((u) => u.name).join(", ")}`);
  }
  if (addToGraph && report.addedToGraph.length > 0) {
    console.log(`Added to graph: ${report.addedToGraph.join(", ")}`);
  }
  if (report.graphErrors.length > 0) {
    console.error(`Graph errors: ${report.graphErrors.length}`);
    for (const e of report.graphErrors) console.error(`  ${e.name}: ${e.error}`);
  }
  console.log(`Report: ${reportPath}`);

  if (report.conflicts.length > 0) {
    console.error(`\nConflicts requiring user resolution: ${report.conflicts.length}`);
    for (const c of report.conflicts) {
      console.error(`  ${c.name}: ${c.reason}`);
    }
    process.exit(2);
  }
}

main();
