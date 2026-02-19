#!/usr/bin/env bun
/**
 * ingest-wiki — qmd wrapper for riviere-architect phase-0b
 *
 * Shape rules:
 *   single-file   A .md file        → one collection named after the file
 *   directory     A flat directory   → one collection named after the folder
 *   multi-wiki    A dir of dirs      → each subdir becomes its own collection
 *   git-url       A .git URL         → cloned to ./wiki/, then indexed
 *
 * Usage:
 *   bun ingest-wiki.ts <path-or-url> [collection-name]
 *   bun ingest-wiki.ts --help
 */

import { existsSync, statSync, mkdirSync, copyFileSync, readdirSync } from "fs";
import { resolve, extname, basename } from "path";
import { execSync, spawnSync } from "child_process";

// ─── Help ────────────────────────────────────────────────────────────────────

const HELP = `
ingest-wiki — index wiki data into qmd for riviere-architect

USAGE
  bun ingest-wiki.ts <path-or-url> [collection-name]
  bun ingest-wiki.ts --help

SHAPE RULES
  ./README.md        single-file  → collection named "README" (or [collection-name])
  ./wiki/            directory    → collection named "wiki"   (or [collection-name])
  ./wikis/           multi-wiki   → one collection per subdir, each named after the subdir
  https://…repo.git  git-url      → cloned to ./wiki/, then indexed as [collection-name]

  collection-name is ignored for multi-wiki (subdirectory names are used instead).

EXAMPLES
  bun ingest-wiki.ts ./docs/architecture.md
  bun ingest-wiki.ts ./wiki/
  bun ingest-wiki.ts ~/code/work/project/wikis/
  bun ingest-wiki.ts https://github.com/my-org/my-repo.wiki.git
  bun ingest-wiki.ts ./wiki/ my-project
`.trim();

if (process.argv[2] === "--help" || process.argv[2] === "-h") {
  console.log(HELP);
  process.exit(0);
}

// ─── Args ────────────────────────────────────────────────────────────────────

const input = process.argv[2];

if (!input) {
  console.error("Error: missing <path-or-url> argument\n");
  console.error(HELP);
  process.exit(1);
}

// ─── Prereq check ────────────────────────────────────────────────────────────

const prereqCheck = spawnSync("qmd", ["--version"], { stdio: "pipe" });
if (prereqCheck.error) {
  console.error("Error: 'qmd' is not installed or not on PATH");
  console.error("Install: npm install -g @tobilu/qmd  OR  bun install -g @tobilu/qmd");
  process.exit(1);
}

// ─── Shape detection ─────────────────────────────────────────────────────────

type WikiShape = "single-file" | "directory" | "multi-wiki" | "git-url";

function detectShape(input: string): WikiShape {
  // Git URL
  if (input.endsWith(".git") || input.match(/github\.com.*\.wiki/) || input.match(/^https?:\/\//)) {
    return "git-url";
  }

  // Path must exist
  if (!existsSync(input)) {
    console.error(`Error: path not found: ${input}`);
    console.error("\nOptions:");
    console.error("  • Run Phase 0A first to generate a wiki with DeepWiki");
    console.error("  • Pass an existing docs directory (e.g. ./docs/)");
    console.error("  • Pass a GitHub wiki URL (e.g. https://github.com/org/repo.wiki.git)");
    process.exit(1);
  }

  const stat = statSync(input);

  if (stat.isFile() && extname(input).toLowerCase() === ".md") return "single-file";

  if (stat.isDirectory()) {
    const entries = readdirSync(input, { withFileTypes: true });
    const subdirs = entries.filter((e) => e.isDirectory());
    // Any subdirectories → multi-wiki (each subdir is a separate wiki)
    if (subdirs.length > 0) return "multi-wiki";
    return "directory";
  }

  console.error(`Error: cannot determine shape of: ${input}`);
  console.error("Expected: a .md file, a directory, or a .git URL");
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function run(cmd: string) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function toCollectionName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function countMd(dir: string): number {
  try { return readdirSync(dir, { recursive: true } as any).filter((f: any) => String(f).endsWith(".md")).length; }
  catch { return 0; }
}

// ─── Main ────────────────────────────────────────────────────────────────────

const shape = detectShape(input);

// Default collection name = basename of input (no extension for files)
const defaultName = shape === "single-file"
  ? basename(input, extname(input))
  : basename(resolve(input));
const collectionName = process.argv[3] ?? toCollectionName(defaultName);

console.log(`\nDetected shape: ${shape}`);

switch (shape) {
  case "single-file": {
    const wikiDir = resolve("./wiki");
    if (!existsSync(wikiDir)) mkdirSync(wikiDir, { recursive: true });
    const dest = `${wikiDir}/${basename(input)}`;
    copyFileSync(resolve(input), dest);
    console.log(`Copied ${input} → ${dest}`);
    run(`qmd collection add "${wikiDir}" --name ${collectionName}`);
    run(`qmd context add qmd://${collectionName} "${defaultName} — architecture, components, decisions"`);
    break;
  }

  case "directory": {
    const collectionPath = resolve(input);
    const mdCount = countMd(collectionPath);
    console.log(`Collection: ${collectionName} (${mdCount} .md files)`);
    run(`qmd collection add "${collectionPath}" --name ${collectionName}`);
    run(`qmd context add qmd://${collectionName} "${defaultName} — architecture, components, decisions"`);
    break;
  }

  case "multi-wiki": {
    const rootPath = resolve(input);
    const subdirs = readdirSync(rootPath, { withFileTypes: true }).filter((e) => e.isDirectory());

    console.log(`\nFound ${subdirs.length} subdir(s) — creating one collection each:`);
    subdirs.forEach((d) => console.log(`  ${d.name}/`));

    for (const dir of subdirs) {
      const subPath = `${rootPath}/${dir.name}`;
      const name = toCollectionName(dir.name);
      const mdCount = countMd(subPath);
      console.log(`\n── ${dir.name} → collection: ${name} (${mdCount} .md files)`);
      run(`qmd collection add "${subPath}" --name ${name}`);
      run(`qmd context add qmd://${name} "${dir.name} — architecture, components, decisions"`);
    }
    break;
  }

  case "git-url": {
    const wikiDir = resolve("./wiki");
    if (existsSync(wikiDir)) {
      console.log(`./wiki already exists — skipping clone`);
    } else {
      run(`git clone "${input}" wiki`);
    }
    run(`qmd collection add "${wikiDir}" --name ${collectionName}`);
    run(`qmd context add qmd://${collectionName} "${collectionName} — architecture, components, decisions"`);
    break;
  }
}

// ─── Embed ───────────────────────────────────────────────────────────────────

run(`qmd embed`);

console.log(`\n✓ Done. qmd collection(s) indexed and ready to query.`);
console.log(`  Proceed to Phase 1: references/phase-1-orchestrator.md`);
