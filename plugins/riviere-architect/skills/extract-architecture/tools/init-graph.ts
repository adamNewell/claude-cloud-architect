#!/usr/bin/env bun
/**
 * init-graph — initialize Rivière graph from Configure artifacts
 *
 * Reads:
 *   .riviere/config/domains.json                — domain registry
 *   .riviere/config/component-definitions.json  — optional Custom Types
 *   .riviere/config/metadata.json               — repo roots for source URLs
 *
 * Runs the Extract initialization sequence:
 *   1. riviere builder init               — first source + first domain
 *   2. riviere builder add-source         — remaining repositories
 *   3. riviere builder add-domain         — remaining domains
 *   4. riviere builder define-custom-type — accepted custom types (if defined)
 *
 * Source URLs are resolved from (in order):
 *   1. --source-url repo-name=https://... flags
 *   2. .riviere/config/metadata.json repositories[].root → git remote get-url origin
 *   3. .riviere/work/meta-{repo}.jsonl structure facet → git remote get-url origin
 *
 * Usage:
 *   bun init-graph.ts
 *   bun init-graph.ts --dry-run
 *   bun init-graph.ts --source-url orders-service=https://github.com/org/orders-service
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { execSync, spawnSync } from "child_process";

// ─── Help ─────────────────────────────────────────────────────────────────────

const HELP = `
init-graph — initialize Rivière graph from Configure artifacts

Reads:
  .riviere/config/domains.json                — domain registry
  .riviere/config/component-definitions.json  — Custom Types table (optional)
  .riviere/config/metadata.json               — repo roots for source URLs

Runs:
  riviere builder init              first source + first domain
  riviere builder add-source        remaining repositories
  riviere builder add-domain        remaining domains
  riviere builder define-custom-type  accepted custom types

Source URLs resolved from (in order):
  1. --source-url repo-name=https://...  (explicit flag)
  2. .riviere/config/metadata.json repositories[].root → git remote get-url origin
  3. .riviere/work/meta-{repo}.jsonl structure facet → git remote get-url origin

USAGE
  bun init-graph.ts [options]

OPTIONS
  --dry-run                       Print commands without executing
  --project-root <dir>            Resolve .riviere/ paths relative to this directory (default: cwd)
  --source-url name=https://...   Map repo name to GitHub URL (repeatable)
  --help, -h                      Show this message

EXAMPLES
  bun init-graph.ts
  bun init-graph.ts --dry-run
  bun init-graph.ts --project-root /path/to/project
  bun init-graph.ts \\
    --source-url orders-service=https://github.com/org/orders-service \\
    --source-url payments=https://github.com/org/payments-service
`.trim();

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

const DRY_RUN = args.includes("--dry-run");
if (DRY_RUN) console.log("── dry-run — commands printed but not executed ──\n");

// --project-root: resolve .riviere/ paths relative to this directory (default: cwd)
const projectRootIdx = args.indexOf("--project-root");
const PROJECT_ROOT = resolve(projectRootIdx >= 0 && args[projectRootIdx + 1] ? args[projectRootIdx + 1] : ".");

/** Resolve a path relative to the project root (where .riviere/ lives). */
function fromRoot(...segments: string[]): string {
  return resolve(PROJECT_ROOT, ...segments);
}

const sourceUrlOverrides = new Map<string, string>();
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--source-url" && args[i + 1]) {
    const eq = args[i + 1].indexOf("=");
    if (eq > 0) {
      const name = args[i + 1].slice(0, eq).trim();
      const url = args[i + 1].slice(eq + 1).trim();
      if (name && url) sourceUrlOverrides.set(name, url);
    }
    i++;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Domain {
  name: string;
  systemType: string;
  description: string;
  repositories: string[];
}

interface CustomTypeProp {
  name: string;
  type: string;
  description: string;
}

interface CustomType {
  name: string;
  description: string;
  requiredProperties: CustomTypeProp[];
  optionalProperties: CustomTypeProp[];
}

// ─── Parse domains ───────────────────────────────────────────────────────────

const DOMAINS_JSON_PATH = fromRoot(".riviere/config/domains.json");

let domains: Domain[] = [];

if (existsSync(DOMAINS_JSON_PATH)) {
  const domainsData = JSON.parse(readFileSync(DOMAINS_JSON_PATH, "utf8"));
  domains = (domainsData.domains ?? [])
    .map((d: Record<string, unknown>) => ({
      name: String(d.name ?? "").trim(),
      systemType: String(d.type ?? "domain").trim().toLowerCase(),
      description: String(d.description ?? "").trim(),
      repositories: Array.isArray(d.repositories)
        ? d.repositories.map(String).filter(Boolean)
        : [],
    }))
    .filter((d: Domain) => d.name);

  if (domains.length) {
    console.log(`Read ${domains.length} domain(s) from domains.json`);
  }
}

if (!domains.length) {
  console.error("Error: No domains found. Checked:");
  console.error(`  ${DOMAINS_JSON_PATH}`);
  console.error(
    "Run Explore to generate the domain registry before initializing the graph."
  );
  process.exit(1);
}

// Unique repositories across all domains (preserve insertion order)
const allRepos = [...new Set(domains.flatMap((d) => d.repositories))];

console.log(
  `\nDomains: ${domains.length}  |  Repositories: ${allRepos.length}\n`
);
domains.forEach((d) =>
  console.log(`  ${d.name.padEnd(20)} (${d.systemType}) — ${d.repositories.join(", ")}`)
);

// ─── Resolve source URLs ──────────────────────────────────────────────────────

// Pre-load metadata.json repo roots if available
const metadataJsonPath = fromRoot(".riviere/config/metadata.json");
const metadataRepoRoots = new Map<string, string>();

if (existsSync(metadataJsonPath)) {
  try {
    const metadata = JSON.parse(readFileSync(metadataJsonPath, "utf8"));
    for (const repo of metadata.repositories ?? []) {
      if (repo.name && repo.root) {
        metadataRepoRoots.set(String(repo.name), String(repo.root));
      }
    }
  } catch {
    // metadata.json malformed — fall through to other methods
  }
}

function resolveRootPath(repoName: string): string | null {
  // 1. metadata.json
  if (metadataRepoRoots.has(repoName)) return metadataRepoRoots.get(repoName)!;

  // 2. meta-{repo}.jsonl — look for structure facet
  const jsonlPath = fromRoot(`.riviere/work/meta-${repoName}.jsonl`);
  if (existsSync(jsonlPath)) {
    const lines = readFileSync(jsonlPath, "utf8").split("\n").filter((l) => l.trim());
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj.facet === "structure" && obj.root) {
          return String(obj.root).trim();
        }
      } catch {
        // skip malformed
      }
    }
  }

  return null;
}

function resolveSourceUrl(repoName: string): string | null {
  // 1. Explicit --source-url flag
  if (sourceUrlOverrides.has(repoName)) return sourceUrlOverrides.get(repoName)!;

  // 2. Resolve root path from metadata.json / JSONL, then git remote
  const localPath = resolveRootPath(repoName);
  if (localPath) {
    const result = spawnSync("git", ["-C", localPath, "remote", "get-url", "origin"], {
      encoding: "utf8",
    });
    if (result.status === 0 && result.stdout.trim()) {
      return result.stdout.trim().replace(/\.git$/, "");
    }
  }

  return null;
}

const resolvedUrls = new Map<string, string>();
const unresolved: string[] = [];

for (const repo of allRepos) {
  const url = resolveSourceUrl(repo);
  if (url) {
    resolvedUrls.set(repo, url);
  } else {
    unresolved.push(repo);
  }
}

if (unresolved.length) {
  console.error(
    `\nError: Could not resolve source URL for ${unresolved.length} repository/repositories:`
  );
  unresolved.forEach((r) => console.error(`  ${r}`));
  console.error("\nFix with --source-url flags:");
  unresolved.forEach((r) =>
    console.error(`  --source-url ${r}=https://github.com/your-org/${r}`)
  );
  process.exit(1);
}

console.log("\nResolved source URLs:");
resolvedUrls.forEach((url, repo) =>
  console.log(`  ${repo.padEnd(30)} → ${url}`)
);

// ─── Parse custom types ──────────────────────────────────────────────────────

const DEFS_JSON_PATH = fromRoot(".riviere/config/component-definitions.json");
const customTypes: CustomType[] = [];

if (existsSync(DEFS_JSON_PATH)) {
  try {
    const defsData = JSON.parse(readFileSync(DEFS_JSON_PATH, "utf8"));
    for (const ct of defsData.customTypes ?? []) {
      const name = String(ct.name ?? "").trim();
      if (!name) continue;

      const parseJsonProps = (props: unknown[]): CustomTypeProp[] =>
        (props ?? []).map((p: unknown) => {
          const prop = p as Record<string, unknown>;
          return {
            name: String(prop.name ?? ""),
            type: String(prop.type ?? "string"),
            description: String(prop.description ?? ""),
          };
        }).filter((p) => p.name);

      customTypes.push({
        name,
        description: String(ct.description ?? ""),
        requiredProperties: parseJsonProps(ct.requiredProperties),
        optionalProperties: parseJsonProps(ct.optionalProperties),
      });
    }

    if (customTypes.length) {
      console.log(`\nCustom types: ${customTypes.map((t) => t.name).join(", ")}`);
    }
  } catch {
    console.warn("Warning: component-definitions.json exists but could not be parsed");
  }
}

// ─── CLI runner ───────────────────────────────────────────────────────────────

function run(cmd: string): void {
  console.log(`\n$ ${cmd}`);
  if (!DRY_RUN) execSync(cmd, { stdio: "inherit" });
}

// ─── Initialization sequence ─────────────────────────────────────────────────

const repoEntries = [...resolvedUrls.entries()];
const [, firstUrl] = repoEntries[0];
const firstDomain = domains[0];

console.log("\n── initializing graph ───────────────────────────────────────────");

// 1. init — first source + first domain
run(
  `npx riviere builder init` +
    ` --source "${firstUrl}"` +
    ` --domain '${JSON.stringify({
      name: firstDomain.name,
      description: firstDomain.description,
      systemType: firstDomain.systemType,
    })}'`
);

// 2. add-source — remaining repositories
for (const [, url] of repoEntries.slice(1)) {
  run(`npx riviere builder add-source --repository "${url}"`);
}

// 3. add-domain — remaining domains
for (const domain of domains.slice(1)) {
  run(
    `npx riviere builder add-domain` +
      ` --name "${domain.name}"` +
      ` --system-type "${domain.systemType}"` +
      ` --description "${domain.description}"`
  );
}

// 4. define-custom-type — accepted custom types
for (const ct of customTypes) {
  let cmd =
    `npx riviere builder define-custom-type` +
    ` --name "${ct.name}"` +
    ` --description "${ct.description}"`;
  for (const p of ct.requiredProperties) {
    cmd += ` --required-property "${p.name}:${p.type}:${p.description}"`;
  }
  for (const p of ct.optionalProperties) {
    cmd += ` --optional-property "${p.name}:${p.type}:${p.description}"`;
  }
  run(cmd);
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n✓ ${DRY_RUN ? "Dry-run complete" : "Graph initialized"}.`);
console.log(`  Sources:      ${repoEntries.length}`);
console.log(`  Domains:      ${domains.length}`);
console.log(`  Custom types: ${customTypes.length}`);
if (!DRY_RUN) {
  console.log(`\n  Proceed to Extract: extract components with riviere builder add-component`);
}
