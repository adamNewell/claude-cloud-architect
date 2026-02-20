#!/usr/bin/env bun
/**
 * split-checklist
 *
 * Splits a master checklist into per-repository sub-checklists by matching
 * file paths against repository roots discovered in meta-*.md files.
 *
 * Exit codes:
 *   0 - all lines assigned to a repository
 *   1 - invalid usage or filesystem error
 *   2 - some lines could not be matched to any repository (report written)
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";

interface SplitReport {
  generatedAt: string;
  checklist: string;
  outputDir: string;
  prefix: string;
  repos: Record<string, { root: string; lineCount: number; outputFile: string }>;
  unmatchedLines: string[];
  totalLines: number;
}

const HELP = `
split-checklist

Split a master checklist into per-repository sub-checklists.

USAGE
  bun tools/split-checklist.ts --checklist <path> [options]

OPTIONS
  --checklist <path>       Master checklist file to split (required)
  --output-dir <path>      Output directory for sub-checklists (default: .riviere/work)
  --prefix <string>        Output filename prefix (default: checklist)
                           Produces: {prefix}-{repo-name}.md
  --meta-dir <path>        Directory containing meta-*.md files (default: .riviere/work)
  --project-root <path>    Resolve .riviere/ paths relative to this directory (default: cwd)
  --help, -h               Show this help

EXAMPLES
  # Step 4 — split connect checklist
  bun tools/split-checklist.ts --checklist .riviere/connect-checklist.md --prefix checklist

  # Step 5 — split enrichment checklist
  bun tools/split-checklist.ts --checklist .riviere/step-5-checklist.md --prefix enrich
`.trim();

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/**
 * Extract repo roots from meta-*.md files.
 * Looks for lines matching: "- Root: /absolute/path"
 */
function discoverRepoRoots(metaDir: string): Map<string, string> {
  const roots = new Map<string, string>();

  if (!existsSync(metaDir)) return roots;

  const metaFiles = readdirSync(metaDir).filter((f) => /^meta-.*\.md$/.test(f));

  for (const file of metaFiles) {
    const content = readFileSync(join(metaDir, file), "utf8");
    const match = content.match(/^-\s*Root:\s*(.+)$/m);
    if (match) {
      const rootPath = match[1].trim();
      // Extract repo name from the meta filename: meta-{repo}.md
      const repoMatch = file.match(/^meta-(.+)\.md$/);
      if (repoMatch) {
        roots.set(repoMatch[1], rootPath);
      }
    }
  }

  return roots;
}

/**
 * Match a checklist line to a repository by finding the longest matching root prefix.
 * Uses exact path prefix matching to avoid /api matching /api-gateway.
 */
function matchLineToRepo(line: string, roots: Map<string, string>): string | null {
  let bestMatch: string | null = null;
  let bestLength = 0;

  for (const [repoName, rootPath] of roots) {
    // Check if the line contains this root path
    // Use path boundary check: root must be followed by / or end of string
    const idx = line.indexOf(rootPath);
    if (idx >= 0) {
      const afterRoot = line[idx + rootPath.length];
      const isPathBoundary = afterRoot === "/" || afterRoot === ")" || afterRoot === " " || afterRoot === undefined;
      if (isPathBoundary && rootPath.length > bestLength) {
        bestMatch = repoName;
        bestLength = rootPath.length;
      }
    }
  }

  return bestMatch;
}

function main(): void {
  if (hasFlag("--help") || hasFlag("-h")) {
    console.log(HELP);
    return;
  }

  const checklistPath = argValue("--checklist");
  if (!checklistPath) {
    console.error("Missing required --checklist argument");
    process.exit(1);
  }

  const resolvedChecklist = resolve(checklistPath);
  if (!existsSync(resolvedChecklist)) {
    console.error(`Checklist not found: ${resolvedChecklist}`);
    process.exit(1);
  }

  // --project-root: resolve .riviere/ paths relative to this directory (default: cwd)
  const PROJECT_ROOT = resolve(argValue("--project-root") ?? ".");

  const outputDir = argValue("--output-dir")
    ? resolve(argValue("--output-dir")!)
    : resolve(PROJECT_ROOT, ".riviere/work");
  const prefix = argValue("--prefix") ?? "checklist";
  const metaDir = argValue("--meta-dir")
    ? resolve(argValue("--meta-dir")!)
    : resolve(PROJECT_ROOT, ".riviere/work");

  const roots = discoverRepoRoots(metaDir);
  if (roots.size === 0) {
    console.error(`No repository roots found in ${metaDir} (expected meta-*.md files with "- Root: ..." lines)`);
    process.exit(1);
  }

  console.log(`Discovered ${roots.size} repository root(s):`);
  for (const [name, root] of roots) {
    console.log(`  ${name}: ${root}`);
  }

  const lines = readFileSync(resolvedChecklist, "utf8").split("\n");

  // Buckets: repo name -> lines
  const buckets = new Map<string, string[]>();
  for (const name of roots.keys()) {
    buckets.set(name, []);
  }

  const unmatchedLines: string[] = [];
  let totalContentLines = 0;

  for (const line of lines) {
    // Skip empty lines and header lines (not checklist items)
    if (!line.trim()) continue;

    // Checklist items contain file paths — try to match
    const repo = matchLineToRepo(line, roots);
    if (repo) {
      buckets.get(repo)!.push(line);
      totalContentLines++;
    } else if (line.startsWith("- [")) {
      // Checklist item that didn't match any repo — flag it
      unmatchedLines.push(line);
      totalContentLines++;
    }
    // Non-checklist lines (headers, blank lines) are silently skipped
  }

  // Write sub-checklists
  mkdirSync(outputDir, { recursive: true });

  const report: SplitReport = {
    generatedAt: new Date().toISOString(),
    checklist: resolvedChecklist,
    outputDir,
    prefix,
    repos: {},
    unmatchedLines,
    totalLines: totalContentLines,
  };

  for (const [repoName, repoLines] of buckets) {
    const outputFile = join(outputDir, `${prefix}-${repoName}.md`);
    writeFileSync(outputFile, repoLines.join("\n") + "\n");
    report.repos[repoName] = {
      root: roots.get(repoName)!,
      lineCount: repoLines.length,
      outputFile,
    };
    console.log(`  ${repoName}: ${repoLines.length} item(s) → ${outputFile}`);
  }

  // Warn about empty splits
  const emptyRepos = Object.entries(report.repos).filter(([, v]) => v.lineCount === 0);
  if (emptyRepos.length > 0) {
    console.warn(`\nWarning: ${emptyRepos.length} repo(s) have empty sub-checklists:`);
    for (const [name, info] of emptyRepos) {
      console.warn(`  ${name} (root: ${info.root}) — verify path format matches checklist entries`);
    }
  }

  const reportPath = join(outputDir, `${prefix}-split-report.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\nSplit ${totalContentLines} item(s) across ${roots.size} repo(s).`);
  console.log(`Report: ${reportPath}`);

  if (unmatchedLines.length > 0) {
    console.error(`\nUnmatched lines: ${unmatchedLines.length} (could not assign to any repository)`);
    for (const line of unmatchedLines.slice(0, 5)) {
      console.error(`  ${line.substring(0, 120)}`);
    }
    if (unmatchedLines.length > 5) {
      console.error(`  ... and ${unmatchedLines.length - 5} more (see report)`);
    }
    process.exit(2);
  }
}

main();
