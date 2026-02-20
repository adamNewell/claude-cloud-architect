#!/usr/bin/env bun
/**
 * triangulate
 *
 * Merges JSONL outputs from multiple discovery prongs with confidence scoring.
 *
 * Three-prong triangulation:
 *   - Items found by 3 prongs -> confidence: "HIGH", auto-accept
 *   - Items found by 2 prongs -> confidence: "MEDIUM", auto-accept with flag
 *   - Items found by 1 prong  -> confidence: "LOW", flag for user review
 *   - Contradictions (same identity, different values) -> escalate to user
 *
 * Exit codes:
 *   0 - triangulation completed successfully
 *   1 - invalid usage or filesystem error
 *   2 - contradictions detected that require user resolution
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";

interface ProngFinding {
  [key: string]: unknown;
  prong?: string;
}

interface TriangulatedItem {
  name: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  prongs: string[];
  data: Record<string, unknown>;
  contradictions: Array<{ field: string; values: Record<string, unknown> }>;
}

interface TriangulationReport {
  generatedAt: string;
  inputDir: string;
  outputPath: string;
  filesProcessed: string[];
  totalFindings: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  contradictions: number;
}

const HELP = `
triangulate

Merge JSONL outputs from multiple discovery prongs with confidence scoring.

USAGE
  bun tools/triangulate.ts [options]

OPTIONS
  --input-dir <dir>          Directory containing prong output files (default: .riviere/work)
  --output <path>            Output file path (default: .riviere/work/triangulated.jsonl)
  --prong-prefix <prefix>    File prefix for prong outputs (default: "meta-")
  --key-field <field>        Identity key for matching across prongs (default: "name")
  --project-root <path>      Resolve .riviere/ paths relative to this directory (default: cwd)
  --dry-run                  Show what would change without writing
  --help, -h                 Show this help

CONFIDENCE LEVELS
  HIGH    Found by 3 prongs — auto-accepted
  MEDIUM  Found by 2 prongs — auto-accepted with flag
  LOW     Found by 1 prong  — flagged for user review

EXAMPLE
  bun tools/triangulate.ts --project-root "$PROJECT_ROOT" \\
    --input-dir "$PROJECT_ROOT/.riviere/work" \\
    --output "$PROJECT_ROOT/.riviere/work/triangulated-explore.jsonl" \\
    --prong-prefix "meta-"
`.trim();

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/**
 * Parse a JSONL file into an array of findings.
 * Lines that are not valid JSON are skipped with a warning.
 */
function parseJsonlFile(filePath: string): ProngFinding[] {
  const content = readFileSync(filePath, "utf8");
  const findings: ProngFinding[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      findings.push(JSON.parse(trimmed));
    } catch {
      console.warn(`Skipping invalid JSON line in ${filePath}: ${trimmed.slice(0, 80)}...`);
    }
  }

  return findings;
}

/**
 * Infer prong name from filename or finding data.
 * Checks the finding's "prong" field first, then falls back to filename heuristics.
 */
function inferProng(finding: ProngFinding, fileName: string): string {
  if (finding.prong && typeof finding.prong === "string") {
    return finding.prong;
  }

  // Heuristic: if filename contains known prong keywords
  const lower = fileName.toLowerCase();
  if (lower.includes("semantic")) return "semantic";
  if (lower.includes("agentic")) return "agentic";

  // Default: deterministic (Prong 1)
  return "deterministic";
}

/**
 * Deep comparison of two values for contradiction detection.
 */
function valuesContradict(a: unknown, b: unknown): boolean {
  if (a === b) return false;
  if (a === undefined || b === undefined) return false;
  if (a === null || b === null) return a !== b;

  if (typeof a !== typeof b) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return true;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return JSON.stringify(sortedA) !== JSON.stringify(sortedB);
  }

  if (typeof a === "object" && typeof b === "object") {
    return JSON.stringify(a) !== JSON.stringify(b);
  }

  return a !== b;
}

function main(): void {
  if (hasFlag("--help") || hasFlag("-h")) {
    console.log(HELP);
    return;
  }

  // --project-root: resolve .riviere/ paths relative to this directory (default: cwd)
  const PROJECT_ROOT = resolve(argValue("--project-root") ?? ".");

  const inputDir = argValue("--input-dir")
    ? resolve(argValue("--input-dir")!)
    : resolve(PROJECT_ROOT, ".riviere/work");
  const outputPath = argValue("--output")
    ? resolve(argValue("--output")!)
    : resolve(PROJECT_ROOT, ".riviere/work/triangulated.jsonl");
  const prongPrefix = argValue("--prong-prefix") ?? "meta-";
  const keyField = argValue("--key-field") ?? "name";
  const dryRun = hasFlag("--dry-run");

  if (!existsSync(inputDir)) {
    console.error(`Input directory not found: ${inputDir}`);
    process.exit(1);
  }

  // Find prong output files matching the prefix
  const prongFiles = readdirSync(inputDir)
    .filter((f) => f.startsWith(prongPrefix) && f.endsWith(".jsonl"))
    .sort();

  if (prongFiles.length === 0) {
    console.log(
      `No prong output files found in ${inputDir} (pattern: ${prongPrefix}*.jsonl)`
    );
    return;
  }

  // Collect all findings grouped by identity key
  const findingsByKey = new Map<
    string,
    Array<{ prong: string; data: ProngFinding; source: string }>
  >();

  const filesProcessed: string[] = [];
  let totalFindings = 0;

  for (const fileName of prongFiles) {
    const fullPath = join(inputDir, fileName);
    filesProcessed.push(fullPath);

    const findings = parseJsonlFile(fullPath);
    totalFindings += findings.length;

    for (const finding of findings) {
      const key = finding[keyField];
      if (key === undefined || key === null) {
        console.warn(
          `Skipping finding without key field "${keyField}" in ${fileName}`
        );
        continue;
      }

      const keyStr = String(key).toLowerCase();
      const prong = inferProng(finding, fileName);

      if (!findingsByKey.has(keyStr)) {
        findingsByKey.set(keyStr, []);
      }
      findingsByKey.get(keyStr)!.push({ prong, data: finding, source: fileName });
    }
  }

  // Triangulate: merge findings per identity key
  const triangulated: TriangulatedItem[] = [];

  for (const [keyStr, entries] of findingsByKey) {
    // Deduplicate prongs (same prong might appear multiple times for same key)
    const uniqueProngs = [...new Set(entries.map((e) => e.prong))];
    const prongCount = uniqueProngs.length;

    // Determine confidence
    let confidence: "HIGH" | "MEDIUM" | "LOW";
    if (prongCount >= 3) {
      confidence = "HIGH";
    } else if (prongCount === 2) {
      confidence = "MEDIUM";
    } else {
      confidence = "LOW";
    }

    // Merge data from all prongs — use first occurrence as base, detect contradictions
    const mergedData: Record<string, unknown> = {};
    const contradictions: Array<{ field: string; values: Record<string, unknown> }> = [];
    const seenFields = new Map<string, { value: unknown; prong: string }>();

    for (const entry of entries) {
      for (const [field, value] of Object.entries(entry.data)) {
        // Skip meta fields
        if (field === "prong") continue;

        if (!seenFields.has(field)) {
          seenFields.set(field, { value, prong: entry.prong });
          mergedData[field] = value;
        } else {
          const existing = seenFields.get(field)!;
          if (valuesContradict(existing.value, value)) {
            // Check if we already recorded this contradiction
            const existingContradiction = contradictions.find(
              (c) => c.field === field
            );
            if (existingContradiction) {
              existingContradiction.values[entry.prong] = value;
            } else {
              contradictions.push({
                field,
                values: {
                  [existing.prong]: existing.value,
                  [entry.prong]: value,
                },
              });
            }
          }
        }
      }
    }

    // Use the canonical key value (preserve original casing from first entry)
    const canonicalName =
      (entries[0].data[keyField] as string) ?? keyStr;

    triangulated.push({
      name: canonicalName,
      confidence,
      prongs: uniqueProngs,
      data: mergedData,
      contradictions,
    });
  }

  // Sort by confidence (HIGH first, then MEDIUM, then LOW)
  const confidenceOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  triangulated.sort(
    (a, b) =>
      confidenceOrder[a.confidence] - confidenceOrder[b.confidence] ||
      a.name.localeCompare(b.name)
  );

  // Compute statistics
  const highCount = triangulated.filter((t) => t.confidence === "HIGH").length;
  const mediumCount = triangulated.filter((t) => t.confidence === "MEDIUM").length;
  const lowCount = triangulated.filter((t) => t.confidence === "LOW").length;
  const contradictionCount = triangulated.filter(
    (t) => t.contradictions.length > 0
  ).length;

  if (dryRun) {
    console.log("DRY RUN — no files modified\n");
    console.log(`Files: ${prongFiles.length}`);
    console.log(`Total findings: ${totalFindings}`);
    console.log(`Unique items: ${triangulated.length}`);
    console.log(`  HIGH confidence:   ${highCount}`);
    console.log(`  MEDIUM confidence: ${mediumCount}`);
    console.log(`  LOW confidence:    ${lowCount}`);
    console.log(`  Contradictions:    ${contradictionCount}`);
    return;
  }

  // Write triangulated output
  mkdirSync(dirname(outputPath), { recursive: true });
  const outputLines = triangulated.map((item) => JSON.stringify(item));
  writeFileSync(outputPath, outputLines.join("\n") + "\n");

  // Write report
  const report: TriangulationReport = {
    generatedAt: new Date().toISOString(),
    inputDir,
    outputPath,
    filesProcessed,
    totalFindings,
    highConfidence: highCount,
    mediumConfidence: mediumCount,
    lowConfidence: lowCount,
    contradictions: contradictionCount,
  };

  const reportPath = join(dirname(outputPath), "triangulation-report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Summary to stdout
  console.log(`Triangulation complete.`);
  console.log(`Processed ${prongFiles.length} prong file(s) with ${totalFindings} total findings.`);
  console.log(`Unique items: ${triangulated.length}`);
  console.log(`  HIGH confidence:   ${highCount} (auto-accept)`);
  console.log(`  MEDIUM confidence: ${mediumCount} (auto-accept with flag)`);
  console.log(`  LOW confidence:    ${lowCount} (flagged for user review)`);
  if (contradictionCount > 0) {
    console.log(`  Contradictions:    ${contradictionCount} (escalate to user)`);
  }
  console.log(`Output: ${outputPath}`);
  console.log(`Report: ${reportPath}`);

  if (contradictionCount > 0) {
    console.error(
      `\nContradictions requiring user resolution: ${contradictionCount}`
    );
    for (const item of triangulated) {
      if (item.contradictions.length > 0) {
        console.error(`  ${item.name}:`);
        for (const c of item.contradictions) {
          const vals = Object.entries(c.values)
            .map(([prong, val]) => `${prong}=${JSON.stringify(val)}`)
            .join(", ");
          console.error(`    ${c.field}: ${vals}`);
        }
      }
    }
    process.exit(2);
  }
}

main();
