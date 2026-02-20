#!/usr/bin/env bun
/**
 * discover-linked-repos — scan IaC files for references to internal repositories
 *
 * Detects references across 4 IaC frameworks (CDK, Terraform, CloudFormation/SAM, Pulumi)
 * and 4 reference categories (ECR images, Lambda code paths, TF module sources, internal packages).
 *
 * Filters to internal-only repos using .riviere/config/repo-discovery.yaml config.
 * Deduplicates and tracks cycles to prevent infinite recursion.
 *
 * Usage:
 *   bun discover-linked-repos.ts --project-root /path/to/project <repo-paths...>
 *   bun discover-linked-repos.ts --project-root /path/to/project --already-visited repo1,repo2 <repo-paths...>
 *   bun discover-linked-repos.ts --help
 *
 * Exit codes:
 *   0 — success (discovered repos written)
 *   1 — invalid usage or missing config
 *   2 — no IaC files found in any repo
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from "fs";
import { resolve, basename, relative, join, dirname } from "path";

// ─── Help ─────────────────────────────────────────────────────────────────────

const HELP = `
discover-linked-repos — scan IaC files for references to internal repositories

USAGE
  bun discover-linked-repos.ts --project-root <dir> <repo-path> [repo-path...]
  bun discover-linked-repos.ts --project-root <dir> --already-visited repo1,repo2 <repo-paths...>

OPTIONS
  --project-root <dir>           Resolve .riviere/ relative to this directory (required)
  --already-visited <repos>      Comma-separated repo names already scanned (cycle prevention)
  --help, -h                     Show this message

OUTPUT
  Writes .riviere/work/discovered-repos.json

EXIT CODES
  0 — success
  1 — invalid usage or missing config
  2 — no IaC files found
`.trim();

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

const projectRootIdx = args.indexOf("--project-root");
if (projectRootIdx === -1 || !args[projectRootIdx + 1]) {
  console.error("Error: --project-root is required.");
  process.exit(1);
}
const PROJECT_ROOT = resolve(args[projectRootIdx + 1]);

const visitedIdx = args.indexOf("--already-visited");
const alreadyVisited = new Set<string>(
  visitedIdx >= 0 && args[visitedIdx + 1]
    ? args[visitedIdx + 1].split(",").map((s) => s.trim()).filter(Boolean)
    : []
);

// Collect repo paths (positional args that aren't flags)
const flagIndices = new Set<number>();
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--project-root" || args[i] === "--already-visited") {
    flagIndices.add(i);
    flagIndices.add(i + 1);
  }
}
const repoPaths = args.filter((_, i) => !flagIndices.has(i)).map((p) => resolve(p));

if (repoPaths.length === 0) {
  console.error("Error: At least one repo path is required.");
  process.exit(1);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgConfig {
  github_org: string;
  ecr_account_id: string;
  npm_scope: string;
  known_repos: Record<string, string>; // mapping name -> local path or github url
}

interface DiscoveredRepo {
  name: string;
  source: "ecr_image" | "lambda_code_path" | "terraform_module" | "internal_package";
  evidence: string[];
  found_in: string[];
  local_path: string | null;
  github_url: string | null;
  status: "available" | "not_cloned";
}

interface DiscoveryResult {
  scanned_repos: string[];
  discovered: DiscoveredRepo[];
  skipped_external: string[];
  cycle_prevention: string[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CONFIG_DIR = resolve(PROJECT_ROOT, ".riviere", "config");
const WORK_DIR = resolve(PROJECT_ROOT, ".riviere", "work");
const CONFIG_PATH = resolve(CONFIG_DIR, "repo-discovery.yaml");
const OUTPUT_PATH = resolve(WORK_DIR, "discovered-repos.json");

function parseYamlSimple(content: string): Record<string, any> {
  const result: Record<string, any> = {};
  let currentKey: string | null = null;
  let currentMap: Record<string, string> | null = null;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Top-level key: value
    const kvMatch = trimmed.match(/^(\w+):\s*(.+)$/);
    if (kvMatch && !line.startsWith("  ")) {
      if (currentKey && currentMap) {
        result[currentKey] = currentMap;
      }
      currentKey = null;
      currentMap = null;
      result[kvMatch[1]] = kvMatch[2].replace(/^["']|["']$/g, "");
      continue;
    }

    // Top-level key with no value (start of map)
    const mapStart = trimmed.match(/^(\w+):$/);
    if (mapStart && !line.startsWith("  ")) {
      if (currentKey && currentMap) {
        result[currentKey] = currentMap;
      }
      currentKey = mapStart[1];
      currentMap = {};
      continue;
    }

    // Indented key: value (inside a map)
    if (currentKey && currentMap && line.startsWith("  ")) {
      const nestedKv = trimmed.match(/^(\S+):\s*(.+)$/);
      if (nestedKv) {
        currentMap[nestedKv[1]] = nestedKv[2].replace(/^["']|["']$/g, "");
      }
    }
  }

  if (currentKey && currentMap) {
    result[currentKey] = currentMap;
  }

  return result;
}

function loadConfig(): OrgConfig | null {
  if (!existsSync(CONFIG_PATH)) return null;
  const raw = readFileSync(CONFIG_PATH, "utf8");
  const parsed = parseYamlSimple(raw);
  return {
    github_org: parsed.github_org ?? "",
    ecr_account_id: parsed.ecr_account_id ?? "",
    npm_scope: parsed.npm_scope ?? "",
    known_repos: (parsed.known_repos as Record<string, string>) ?? {},
  };
}

// ─── IaC Detection ────────────────────────────────────────────────────────────

type IacFramework = "cdk" | "terraform" | "cloudformation" | "pulumi";

function detectIacFrameworks(repoRoot: string): IacFramework[] {
  const frameworks: IacFramework[] = [];

  // CDK: cdk.json or cdk.context.json
  if (existsSync(resolve(repoRoot, "cdk.json")) || existsSync(resolve(repoRoot, "cdk.context.json"))) {
    frameworks.push("cdk");
  }

  // Terraform: any .tf file (check top level and one level deep)
  if (hasTfFiles(repoRoot)) {
    frameworks.push("terraform");
  }

  // CloudFormation/SAM: template.yaml or template.yml with AWSTemplateFormatVersion or Transform
  for (const name of ["template.yaml", "template.yml", "template.json", "sam-template.yaml", "sam-template.yml"]) {
    const path = resolve(repoRoot, name);
    if (existsSync(path)) {
      const content = readFileSync(path, "utf8").slice(0, 2000);
      if (content.includes("AWSTemplateFormatVersion") || content.includes("AWS::Serverless")) {
        frameworks.push("cloudformation");
        break;
      }
    }
  }

  // Pulumi: Pulumi.yaml
  if (existsSync(resolve(repoRoot, "Pulumi.yaml")) || existsSync(resolve(repoRoot, "Pulumi.yml"))) {
    frameworks.push("pulumi");
  }

  return frameworks;
}

function hasTfFiles(dir: string): boolean {
  try {
    const entries = readdirSync(dir);
    if (entries.some((e) => e.endsWith(".tf"))) return true;
    // Check one level deep
    for (const entry of entries) {
      const subdir = resolve(dir, entry);
      try {
        if (statSync(subdir).isDirectory() && !entry.startsWith(".") && entry !== "node_modules") {
          const subEntries = readdirSync(subdir);
          if (subEntries.some((e) => e.endsWith(".tf"))) return true;
        }
      } catch { /* skip unreadable dirs */ }
    }
  } catch { /* skip unreadable dirs */ }
  return false;
}

// ─── File Collection ──────────────────────────────────────────────────────────

function collectFiles(dir: string, extensions: string[], maxDepth = 6, currentDepth = 0): string[] {
  if (currentDepth > maxDepth) return [];
  const results: string[] = [];

  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "node_modules" || entry === "dist" || entry === "build" || entry === "coverage" || entry === ".riviere") continue;
      const fullPath = resolve(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          results.push(...collectFiles(fullPath, extensions, maxDepth, currentDepth + 1));
        } else if (extensions.some((ext) => entry.endsWith(ext))) {
          results.push(fullPath);
        }
      } catch { /* skip unreadable */ }
    }
  } catch { /* skip unreadable dirs */ }

  return results;
}

// ─── Reference Extraction ─────────────────────────────────────────────────────

interface RawReference {
  name: string;
  source: DiscoveredRepo["source"];
  evidence: string;
  found_in: string;
}

// ECR image pattern: {account}.dkr.ecr.{region}.amazonaws.com/{image-name}:{tag}
const ECR_PATTERN = /(\d{12})\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com\/([a-zA-Z0-9._\/-]+?)(?::[\w.-]+)?(?=["'\s,})\]]|$)/g;

// Lambda code path patterns
const LAMBDA_CODE_ASSET = /Code\.fromAsset\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const LAMBDA_CODE_URI = /CodeUri:\s*['"]?([^'"}\s]+)['"]?/g;
const LAMBDA_FILENAME = /filename\s*=\s*"([^"]+)"/g;

// Terraform module source
const TF_MODULE_SOURCE = /source\s*=\s*"([^"]+)"/g;

// Internal package imports (npm scope)
const INTERNAL_IMPORT = /(?:from\s+['"]|require\s*\(\s*['"])(@[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+)['")]/g;

// ECR repository in CDK
const ECR_REPO_CDK = /Repository\.fromRepositoryName\s*\([^,]+,\s*['"][^'"]*['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g;
const ECR_REPO_ARN = /Repository\.fromRepositoryArn\s*\([^,]+,\s*['"][^'"]*['"]\s*,\s*['"]arn:aws:ecr:[^:]+:(\d{12}):repository\/([^'"]+)['"]\s*\)/g;

function extractReferences(filePath: string, content: string, config: OrgConfig, repoRoot: string): RawReference[] {
  const refs: RawReference[] = [];
  const lines = content.split("\n");

  // Helper to find line number for a match position
  function lineNumForPos(pos: number): number {
    let count = 1;
    for (let i = 0; i < pos && i < content.length; i++) {
      if (content[i] === "\n") count++;
    }
    return count;
  }

  function locationStr(pos: number): string {
    return `${relative(repoRoot, filePath)}:${lineNumForPos(pos)}`;
  }

  // 1. ECR Images
  let match: RegExpExecArray | null;
  ECR_PATTERN.lastIndex = 0;
  while ((match = ECR_PATTERN.exec(content)) !== null) {
    const accountId = match[1];
    const imageName = match[2];
    if (config.ecr_account_id && accountId === config.ecr_account_id) {
      refs.push({
        name: imageName.replace(/\//g, "-"),
        source: "ecr_image",
        evidence: match[0],
        found_in: locationStr(match.index),
      });
    }
  }

  // ECR repository references in CDK
  ECR_REPO_CDK.lastIndex = 0;
  while ((match = ECR_REPO_CDK.exec(content)) !== null) {
    refs.push({
      name: match[1],
      source: "ecr_image",
      evidence: match[0],
      found_in: locationStr(match.index),
    });
  }

  ECR_REPO_ARN.lastIndex = 0;
  while ((match = ECR_REPO_ARN.exec(content)) !== null) {
    const accountId = match[1];
    const repoName = match[2];
    if (config.ecr_account_id && accountId === config.ecr_account_id) {
      refs.push({
        name: repoName,
        source: "ecr_image",
        evidence: match[0],
        found_in: locationStr(match.index),
      });
    }
  }

  // 2. Lambda code paths
  LAMBDA_CODE_ASSET.lastIndex = 0;
  while ((match = LAMBDA_CODE_ASSET.exec(content)) !== null) {
    const codePath = match[1];
    if (codePath.startsWith("../") || codePath.startsWith("/")) {
      const resolvedDir = codePath.startsWith("/") ? codePath : resolve(dirname(filePath), codePath);
      const repoName = basename(resolvedDir.replace(/\/dist.*|\/build.*|\/\.zip.*/, ""));
      refs.push({
        name: repoName,
        source: "lambda_code_path",
        evidence: match[0],
        found_in: locationStr(match.index),
      });
    }
  }

  LAMBDA_CODE_URI.lastIndex = 0;
  while ((match = LAMBDA_CODE_URI.exec(content)) !== null) {
    const codePath = match[1];
    if (codePath.startsWith("../") || codePath.startsWith("/")) {
      const resolvedDir = codePath.startsWith("/") ? codePath : resolve(dirname(filePath), codePath);
      const repoName = basename(resolvedDir.replace(/\/dist.*|\/build.*|\/\.zip.*/, ""));
      refs.push({
        name: repoName,
        source: "lambda_code_path",
        evidence: match[0],
        found_in: locationStr(match.index),
      });
    }
  }

  LAMBDA_FILENAME.lastIndex = 0;
  while ((match = LAMBDA_FILENAME.exec(content)) !== null) {
    const codePath = match[1];
    if (codePath.startsWith("../") || codePath.startsWith("/")) {
      const resolvedDir = codePath.startsWith("/") ? codePath : resolve(dirname(filePath), codePath);
      const repoName = basename(dirname(resolvedDir));
      refs.push({
        name: repoName,
        source: "lambda_code_path",
        evidence: match[0],
        found_in: locationStr(match.index),
      });
    }
  }

  // 3. Terraform module sources
  if (filePath.endsWith(".tf")) {
    TF_MODULE_SOURCE.lastIndex = 0;
    while ((match = TF_MODULE_SOURCE.exec(content)) !== null) {
      const source = match[1];

      // Local relative modules
      if (source.startsWith("../")) {
        const resolvedDir = resolve(dirname(filePath), source);
        const repoName = basename(resolvedDir);
        refs.push({
          name: repoName,
          source: "terraform_module",
          evidence: match[0],
          found_in: locationStr(match.index),
        });
      }

      // Git-sourced modules from org
      if (config.github_org) {
        const gitMatch = source.match(
          new RegExp(`git::https://github\\.com/${escapeRegex(config.github_org)}/([^.?]+)`)
        );
        if (gitMatch) {
          refs.push({
            name: gitMatch[1],
            source: "terraform_module",
            evidence: match[0],
            found_in: locationStr(match.index),
          });
        }
      }
    }
  }

  // 4. Internal package imports
  if (config.npm_scope) {
    INTERNAL_IMPORT.lastIndex = 0;
    while ((match = INTERNAL_IMPORT.exec(content)) !== null) {
      const pkg = match[1];
      if (pkg.startsWith(config.npm_scope + "/")) {
        refs.push({
          name: pkg.replace(config.npm_scope + "/", ""),
          source: "internal_package",
          evidence: pkg,
          found_in: locationStr(match.index),
        });
      }
    }
  }

  return refs;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Scanning ─────────────────────────────────────────────────────────────────

function scanRepo(repoRoot: string, config: OrgConfig): { refs: RawReference[]; skippedExternal: Set<string> } {
  const frameworks = detectIacFrameworks(repoRoot);
  if (frameworks.length === 0) return { refs: [], skippedExternal: new Set() };

  // Collect relevant files based on detected frameworks
  const extensions: string[] = [];
  if (frameworks.includes("cdk") || frameworks.includes("pulumi")) {
    extensions.push(".ts", ".js", ".py");
  }
  if (frameworks.includes("terraform")) {
    extensions.push(".tf");
  }
  if (frameworks.includes("cloudformation")) {
    extensions.push(".yaml", ".yml", ".json");
  }

  // Deduplicate extensions
  const uniqueExtensions = [...new Set(extensions)];
  const files = collectFiles(repoRoot, uniqueExtensions);

  const allRefs: RawReference[] = [];
  const skippedExternal = new Set<string>();

  for (const file of files) {
    try {
      const content = readFileSync(file, "utf8");
      const refs = extractReferences(file, content, config, repoRoot);
      allRefs.push(...refs);

      // Also collect external package imports for skipped_external
      if (config.npm_scope) {
        INTERNAL_IMPORT.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = INTERNAL_IMPORT.exec(content)) !== null) {
          const pkg = m[1];
          if (!pkg.startsWith(config.npm_scope + "/")) {
            skippedExternal.add(pkg);
          }
        }
      }
    } catch { /* skip unreadable files */ }
  }

  return { refs: allRefs, skippedExternal };
}

// ─── Deduplication & Resolution ───────────────────────────────────────────────

function deduplicateAndResolve(
  allRefs: RawReference[],
  config: OrgConfig,
  scannedRepoRoots: string[]
): { discovered: DiscoveredRepo[]; skippedExternal: string[] } {
  const repoMap = new Map<string, DiscoveredRepo>();
  const allSkippedExternal = new Set<string>();

  for (const ref of allRefs) {
    const existing = repoMap.get(ref.name);
    if (existing) {
      if (!existing.evidence.includes(ref.evidence)) {
        existing.evidence.push(ref.evidence);
      }
      if (!existing.found_in.includes(ref.found_in)) {
        existing.found_in.push(ref.found_in);
      }
    } else {
      // Resolve local path
      let localPath: string | null = null;

      // Check known_repos mapping
      if (config.known_repos[ref.name]) {
        const mapped = config.known_repos[ref.name];
        if (existsSync(mapped)) {
          localPath = resolve(mapped);
        }
      }

      // Check sibling directories of scanned repos
      if (!localPath) {
        for (const repoRoot of scannedRepoRoots) {
          const parentDir = dirname(repoRoot);
          const candidatePath = resolve(parentDir, ref.name);
          if (existsSync(candidatePath)) {
            localPath = candidatePath;
            break;
          }
        }
      }

      // Build GitHub URL if org configured
      let githubUrl: string | null = null;
      if (config.github_org) {
        githubUrl = `https://github.com/${config.github_org}/${ref.name}`;
      }

      repoMap.set(ref.name, {
        name: ref.name,
        source: ref.source,
        evidence: [ref.evidence],
        found_in: [ref.found_in],
        local_path: localPath,
        github_url: githubUrl,
        status: localPath ? "available" : "not_cloned",
      });
    }
  }

  return {
    discovered: Array.from(repoMap.values()),
    skippedExternal: Array.from(allSkippedExternal),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const config = loadConfig();
if (!config) {
  console.error(`Error: Config not found at ${CONFIG_PATH}`);
  console.error("");
  console.error("Create .riviere/config/repo-discovery.yaml with:");
  console.error("");
  console.error("  github_org: your-org");
  console.error("  ecr_account_id: 123456789012");
  console.error("  npm_scope: @your-org");
  console.error("  known_repos:");
  console.error("    repo-name: /local/path/to/repo");
  console.error("");
  process.exit(1);
}

// Check if any repo has IaC files
let anyIac = false;
for (const repoPath of repoPaths) {
  if (detectIacFrameworks(repoPath).length > 0) {
    anyIac = true;
    break;
  }
}

if (!anyIac) {
  console.log("No IaC files detected in any provided repository. Skipping discovery.");
  process.exit(2);
}

// Scan all repos
const allRefs: RawReference[] = [];
const allSkippedExternal = new Set<string>();
const scannedRepoNames: string[] = [];

for (const repoPath of repoPaths) {
  const repoName = basename(repoPath);
  if (alreadyVisited.has(repoName)) {
    console.log(`Skipping ${repoName} (already visited)`);
    continue;
  }

  console.log(`Scanning ${repoName} for IaC references...`);
  const { refs, skippedExternal } = scanRepo(repoPath, config);
  allRefs.push(...refs);
  for (const ext of skippedExternal) allSkippedExternal.add(ext);
  scannedRepoNames.push(repoName);
}

// Filter out self-references (repos referencing themselves)
const selfNames = new Set(repoPaths.map((p) => basename(p)));
const filteredRefs = allRefs.filter((r) => !selfNames.has(r.name) && !alreadyVisited.has(r.name));

// Deduplicate and resolve
const { discovered } = deduplicateAndResolve(filteredRefs, config, repoPaths);

// Build cycle prevention set
const cycleSet = [...alreadyVisited, ...scannedRepoNames];

// Build result
const result: DiscoveryResult = {
  scanned_repos: scannedRepoNames,
  discovered,
  skipped_external: Array.from(allSkippedExternal).sort(),
  cycle_prevention: cycleSet,
};

// Write output
if (!existsSync(WORK_DIR)) {
  mkdirSync(WORK_DIR, { recursive: true });
}
writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2) + "\n", "utf8");

// Report
console.log("");
console.log(`Scanned: ${scannedRepoNames.join(", ")}`);
console.log(`Discovered: ${discovered.length} internal repo reference(s)`);
console.log(`Skipped external: ${allSkippedExternal.size} package(s)`);

if (discovered.length > 0) {
  console.log("");
  for (const repo of discovered) {
    const statusIcon = repo.status === "available" ? "+" : "?";
    console.log(`  [${statusIcon}] ${repo.name} (${repo.source}) — found in ${repo.found_in.length} location(s)`);
  }
}

console.log("");
console.log(`Output: ${OUTPUT_PATH}`);
