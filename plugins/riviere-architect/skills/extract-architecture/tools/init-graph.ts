#!/usr/bin/env bun
/**
 * init-graph — initialize Rivière graph from Configure artifacts
 *
 * Reads:
 *   .riviere/config/domains.md            — domain registry (source of record)
 *   .riviere/config/component-definitions.md — optional Custom Types table
 *
 * Runs the Extract initialization sequence:
 *   1. riviere builder init               — first source + first domain
 *   2. riviere builder add-source         — remaining repositories
 *   3. riviere builder add-domain         — remaining domains
 *   4. riviere builder define-custom-type — accepted custom types (if defined)
 *
 * Source URLs are resolved from (in order):
 *   1. --source-url repo-name=https://... flags
 *   2. .riviere/work/meta-{repo}.md "Root:" path → git remote get-url origin
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
  .riviere/config/domains.md           — domain registry (source of record)
  .riviere/config/component-definitions.md — Custom Types table (optional)

Runs:
  riviere builder init              first source + first domain
  riviere builder add-source        remaining repositories
  riviere builder add-domain        remaining domains
  riviere builder define-custom-type  accepted custom types

Source URLs resolved from (in order):
  1. --source-url repo-name=https://...  (explicit flag)
  2. .riviere/work/meta-{repo}.md Root path → git remote get-url origin

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

// ─── Markdown table parser ────────────────────────────────────────────────────

/**
 * Parse the first markdown table found after an optional heading.
 * Returns an array of row objects keyed by column header.
 */
function parseMarkdownTable(
  content: string,
  afterHeading?: string
): Record<string, string>[] {
  const lines = content.split("\n");
  let searchFrom = 0;

  if (afterHeading) {
    const hi = lines.findIndex(
      (l) =>
        l.match(/^#{1,4}\s+/) &&
        l.toLowerCase().includes(afterHeading.toLowerCase())
    );
    if (hi === -1) return [];
    searchFrom = hi + 1;
  }

  // Find the first table line in range
  const relStart = lines.slice(searchFrom).findIndex((l) => l.trim().startsWith("|"));
  if (relStart === -1) return [];
  const tableStart = searchFrom + relStart;

  const tableLines: string[] = [];
  for (let i = tableStart; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith("|")) {
      tableLines.push(t);
    } else if (t === "") {
      continue; // allow blank lines between rows (some editors add them)
    } else {
      break; // non-pipe, non-blank — table ended
    }
  }

  if (tableLines.length < 2) return [];

  const headers = tableLines[0].split("|").map((h) => h.trim()).filter(Boolean);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < tableLines.length; i++) {
    const line = tableLines[i];
    // Skip separator rows (only dashes, colons, pipes, spaces)
    if (!line.replace(/[|\-:\s]/g, "").trim()) continue;
    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (!cells.length) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = cells[idx] ?? ""));
    rows.push(row);
  }

  return rows;
}

// ─── Parse domains.md ─────────────────────────────────────────────────────────

const DOMAINS_PATH = fromRoot(".riviere/config/domains.md");
if (!existsSync(DOMAINS_PATH)) {
  console.error("Error: .riviere/config/domains.md not found");
  console.error(
    "Run Explore to generate the domain registry before initializing the graph."
  );
  process.exit(1);
}

const domainsContent = readFileSync(DOMAINS_PATH, "utf8");
const domainRows = parseMarkdownTable(domainsContent);

if (!domainRows.length) {
  console.error("Error: No domains found in domains.md");
  console.error(
    "The file must contain a table with columns: Domain Name, Type, Description, Repositories"
  );
  process.exit(1);
}

const domains: Domain[] = domainRows
  .map((row) => ({
    // tolerate both "Domain Name" and "name" as header spellings
    name: (row["Domain Name"] ?? row["Name"] ?? row["name"] ?? "").trim(),
    systemType: (row["Type"] ?? row["type"] ?? "domain").trim().toLowerCase(),
    description: (row["Description"] ?? row["description"] ?? "").trim(),
    repositories: (row["Repositories"] ?? row["repositories"] ?? "")
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean),
  }))
  .filter((d) => d.name);

if (!domains.length) {
  console.error("Error: Could not parse valid domains from domains.md");
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

function resolveSourceUrl(repoName: string): string | null {
  // 1. Explicit --source-url flag
  if (sourceUrlOverrides.has(repoName)) return sourceUrlOverrides.get(repoName)!;

  // 2. meta-{repo}.md Root path → git remote
  const metaPath = fromRoot(`.riviere/work/meta-${repoName}.md`);
  if (existsSync(metaPath)) {
    const content = readFileSync(metaPath, "utf8");
    const match = content.match(/[-*]\s+Root:\s*(.+)/);
    if (match) {
      const localPath = match[1].trim();
      const result = spawnSync("git", ["-C", localPath, "remote", "get-url", "origin"], {
        encoding: "utf8",
      });
      if (result.status === 0 && result.stdout.trim()) {
        return result.stdout.trim().replace(/\.git$/, "");
      }
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

// ─── Parse custom types (optional) ───────────────────────────────────────────

const DEFS_PATH = fromRoot(".riviere/config/component-definitions.md");
const customTypes: CustomType[] = [];

if (existsSync(DEFS_PATH)) {
  const defsContent = readFileSync(DEFS_PATH, "utf8");
  const customRows = parseMarkdownTable(defsContent, "Custom Types");

  for (const row of customRows) {
    const name = (row["Name"] ?? row["name"] ?? "").trim();
    if (!name) continue;

    const parseProps = (cell: string): CustomTypeProp[] =>
      (cell ?? "")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          const parts = s.split(":").map((p) => p.trim());
          return {
            name: parts[0] ?? "",
            type: parts[1] ?? "string",
            description: parts.slice(2).join(":").trim(),
          };
        })
        .filter((p) => p.name);

    customTypes.push({
      name,
      description: (row["Description"] ?? row["description"] ?? "").trim(),
      requiredProperties: parseProps(row["Required Properties"] ?? ""),
      optionalProperties: parseProps(row["Optional Properties"] ?? ""),
    });
  }

  if (customTypes.length) {
    console.log(
      `\nCustom types: ${customTypes.map((t) => t.name).join(", ")}`
    );
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
