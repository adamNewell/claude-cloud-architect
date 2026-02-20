#!/usr/bin/env bun
/**
 * check-hash — detect whether source repositories have changed since last extraction
 *
 * Reads/writes:
 *   .riviere/config/source-hash.json  — stored git SHAs per repo
 *
 * Check mode (default):
 *   Reads source-hash.json, gets current git HEAD SHA for each stored repo path,
 *   compares, and reports FRESH / STALE / NEW.
 *
 * Write mode (--write):
 *   Reads .riviere/work/meta-{repo}.md files for repo paths,
 *   gets current git HEAD SHAs, writes source-hash.json.
 *   Run after successful Step 6 (Validate).
 *
 * Exit codes:
 *   0  FRESH  — all repos unchanged since last extraction (or hash written successfully)
 *   1  STALE  — one or more repos have new commits
 *   2  NEW    — no source-hash.json found (first run or hash missing)
 *
 * Usage:
 *   bun check-hash.ts             # check mode
 *   bun check-hash.ts --write     # write mode — call after successful validate
 *   bun check-hash.ts --dry-run   # check mode, verbose (no side effects)
 */

import { existsSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { spawnSync } from "child_process";

// ─── Help ─────────────────────────────────────────────────────────────────────

const HELP = `
check-hash — detect whether source repositories have changed since last extraction

Reads/writes:
  .riviere/config/source-hash.json  — stored git SHAs per repo

CHECK MODE (default):
  Reads stored SHAs, computes current git HEAD for each repo, compares.

WRITE MODE (--write):
  Reads .riviere/work/meta-{repo}.md files, computes current SHAs, writes hash file.
  Run after successful Step 6 (Validate).

EXIT CODES
  0  FRESH  — all repos unchanged (or write succeeded)
  1  STALE  — one or more repos have new commits
  2  NEW    — no source-hash.json found

USAGE
  bun check-hash.ts            check mode
  bun check-hash.ts --write    write current SHAs after extraction
  bun check-hash.ts --dry-run  verbose check, no side effects
  bun check-hash.ts --help     show this message
`.trim();

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

const WRITE_MODE = args.includes("--write");
const DRY_RUN = args.includes("--dry-run");

// ─── Paths ────────────────────────────────────────────────────────────────────

const HASH_FILE = resolve(".riviere/config/source-hash.json");
const WORK_DIR = resolve(".riviere/work");

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface RepoHash {
  path: string;
  sha: string;
}

interface HashFile {
  generated: string;
  repos: Record<string, RepoHash>;
}

// ─── Git SHA helper ───────────────────────────────────────────────────────────

function getHeadSha(repoPath: string): string | null {
  const result = spawnSync("git", ["-C", repoPath, "rev-parse", "HEAD"], {
    encoding: "utf8",
  });
  if (result.status === 0 && result.stdout.trim()) {
    return result.stdout.trim();
  }
  return null;
}

// ─── Parse meta-{repo}.md for Root path ──────────────────────────────────────

function parseMetaRoot(content: string): string | null {
  const match = content.match(/[-*]\s+Root:\s*(.+)/);
  return match ? match[1].trim() : null;
}

// ─── WRITE MODE ───────────────────────────────────────────────────────────────

if (WRITE_MODE) {
  if (!existsSync(WORK_DIR)) {
    console.error("Error: .riviere/work/ not found.");
    console.error("Run Step 1 (Explore) before writing the hash.");
    process.exit(1);
  }

  const metaFiles = readdirSync(WORK_DIR).filter(
    (f) => f.startsWith("meta-") && f.endsWith(".md")
  );

  if (!metaFiles.length) {
    console.error("Error: No meta-*.md files found in .riviere/work/");
    console.error("Run Step 1 (Explore) to generate repository metadata.");
    process.exit(1);
  }

  const repos: Record<string, RepoHash> = {};
  const failed: string[] = [];

  for (const file of metaFiles) {
    const repoName = file.replace(/^meta-/, "").replace(/\.md$/, "");
    const content = readFileSync(resolve(WORK_DIR, file), "utf8");
    const rootPath = parseMetaRoot(content);

    if (!rootPath) {
      console.warn(`  WARN  ${repoName} — no Root: path found in ${file}, skipping`);
      continue;
    }

    const sha = getHeadSha(rootPath);
    if (!sha) {
      failed.push(repoName);
      console.warn(`  WARN  ${repoName} — could not get git HEAD at ${rootPath}`);
      continue;
    }

    repos[repoName] = { path: rootPath, sha };
    console.log(`  OK    ${repoName.padEnd(28)} ${sha.slice(0, 12)}  (${rootPath})`);
  }

  if (!Object.keys(repos).length) {
    console.error("\nError: No repo SHAs could be resolved. Hash not written.");
    process.exit(1);
  }

  if (failed.length) {
    console.warn(`\n  WARN  ${failed.length} repo(s) skipped — hash may be incomplete`);
  }

  const hashFile: HashFile = {
    generated: new Date().toISOString(),
    repos,
  };

  if (!DRY_RUN) {
    writeFileSync(HASH_FILE, JSON.stringify(hashFile, null, 2) + "\n", "utf8");
    console.log(`\n✓ Hash written → .riviere/config/source-hash.json`);
    console.log(`  Repos: ${Object.keys(repos).length} | Generated: ${hashFile.generated}`);
  } else {
    console.log("\n── dry-run — hash NOT written ──");
    console.log(JSON.stringify(hashFile, null, 2));
  }

  process.exit(0);
}

// ─── CHECK MODE ───────────────────────────────────────────────────────────────

if (!existsSync(HASH_FILE)) {
  console.log("NEW  — no source-hash.json found (first run or hash missing)");
  console.log("       Run the full extraction workflow. Hash will be written after Step 6.");
  process.exit(2);
}

const stored: HashFile = JSON.parse(readFileSync(HASH_FILE, "utf8"));
const storedRepos = Object.entries(stored.repos);

if (!storedRepos.length) {
  console.log("NEW  — source-hash.json exists but contains no repos");
  process.exit(2);
}

console.log(`\nChecking ${storedRepos.length} repo(s) against stored SHAs from ${stored.generated}:\n`);

const stale: string[] = [];
const fresh: string[] = [];
const unreachable: string[] = [];

for (const [name, entry] of storedRepos) {
  const currentSha = getHeadSha(entry.path);

  if (!currentSha) {
    unreachable.push(name);
    console.log(`  WARN  ${name.padEnd(28)} — cannot read git HEAD at ${entry.path}`);
    continue;
  }

  if (currentSha === entry.sha) {
    fresh.push(name);
    console.log(`  FRESH ${name.padEnd(28)} ${currentSha.slice(0, 12)}  (unchanged)`);
  } else {
    stale.push(name);
    console.log(`  STALE ${name.padEnd(28)} stored=${entry.sha.slice(0, 12)}  current=${currentSha.slice(0, 12)}`);
  }
}

console.log("");

if (stale.length > 0) {
  console.log(`STALE — ${stale.length} repo(s) have new commits: ${stale.join(", ")}`);
  if (unreachable.length) {
    console.log(`WARN  — ${unreachable.length} repo(s) unreachable (path may have moved)`);
  }
  console.log("\nRecommendation: Re-run extraction from Step 3 (Extract) or from Step 1 if domains changed.");
  process.exit(1);
} else if (unreachable.length === storedRepos.length) {
  console.log("WARN  — all repos unreachable. Cannot determine staleness.");
  console.log("        Repo paths may have moved since last extraction.");
  process.exit(2);
} else {
  console.log(`FRESH — all ${fresh.length} repo(s) unchanged since last extraction.`);
  console.log("\nOptions:");
  console.log("  1. Query the existing graph — no re-extraction needed");
  console.log("  2. Re-extract anyway (e.g. if extraction rules changed)");
  process.exit(0);
}
