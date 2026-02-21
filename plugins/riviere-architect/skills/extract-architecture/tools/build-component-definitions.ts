#!/usr/bin/env bun
/**
 * build-component-definitions
 *
 * Reads all rules-{repo}-{type}.jsonl staging files produced by configure subagents
 * and deterministically merges them into two config artifacts:
 *
 *   .riviere/config/component-definitions.json
 *     extractionRules  — merged per-type patterns with per-repo overrides where patterns differ
 *     customTypeProposals — collected proposals for user review (not yet accepted)
 *     customTypes      — starts empty; configure orchestrator populates after user approval
 *
 *   .riviere/config/linking-rules.json
 *     httpClients      — deduplicated HTTP client → domain mappings
 *     linkPatterns     — deduplicated non-HTTP linking patterns
 *     validationRules  — deduplicated structural validation rules
 *
 * Merge strategy for extractionRules:
 *   - Single repo  → rule used as-is (no overrides needed)
 *   - Multi-repo   → most common classPattern becomes the base rule;
 *                    repos with differing patterns appear under "overrides"
 *
 * Usage:
 *   bun build-component-definitions.ts --project-root /path/to/project
 *   bun build-component-definitions.ts --project-root /path/to/project --dry-run
 *   bun build-component-definitions.ts --help
 *
 * Exit codes:
 *   0 — success
 *   1 — invalid usage or no JSONL files found
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// ─── Help ─────────────────────────────────────────────────────────────────────

const HELP = `
build-component-definitions

Merges rules-{repo}-{type}.jsonl staging files from .riviere/work/ into
component-definitions.json and linking-rules.json.

USAGE
  bun build-component-definitions.ts --project-root <dir> [--dry-run]

OPTIONS
  --project-root <dir>   Resolve .riviere/ relative to this directory (required)
  --dry-run              Print what would be written without writing files
  --help, -h             Show this message

OUTPUT
  .riviere/config/component-definitions.json
  .riviere/config/linking-rules.json

JSONL KINDS CONSUMED
  extractionRule        Per-type/repo extraction pattern
  example               Code example for an extraction rule
  customTypeProposal    Proposed custom component type (for user review)
  httpClient            HTTP client → domain mapping
  linkPattern           Non-HTTP linking pattern
  validationRule        Structural validation constraint
`.trim();

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

const rootIdx = args.indexOf("--project-root");
if (rootIdx === -1 || !args[rootIdx + 1]) {
  console.error("Error: --project-root is required.");
  process.exit(1);
}
const PROJECT_ROOT = resolve(args[rootIdx + 1]);
const DRY_RUN = args.includes("--dry-run");

// ─── Paths ────────────────────────────────────────────────────────────────────

const WORK_DIR = resolve(PROJECT_ROOT, ".riviere", "work");
const CONFIG_DIR = resolve(PROJECT_ROOT, ".riviere", "config");
const DEFS_OUT = resolve(CONFIG_DIR, "component-definitions.json");
const LINKS_OUT = resolve(CONFIG_DIR, "linking-rules.json");

if (!existsSync(WORK_DIR)) {
  console.error(`Error: .riviere/work/ not found at ${WORK_DIR}`);
  console.error("Run the configure subagents first to produce rules-*.jsonl files.");
  process.exit(1);
}

// ─── JSONL Record Types ───────────────────────────────────────────────────────

interface ExtractionRuleRecord {
  kind: "extractionRule";
  componentType: string;
  repo: string;
  location: string;
  classPattern: string;
  select: string;
  fields: Array<{ schemaField: string; source: string }>;
  exclude?: string[];
  prong?: string;
}

interface ExampleRecord {
  kind: "example";
  componentType: string;
  repo: string;
  matches: boolean;
  snippet: string;
}

interface CustomTypeProposalRecord {
  kind: "customTypeProposal";
  name: string;
  pattern: string;
  instanceCount?: number;
}

interface HttpClientRecord {
  kind: "httpClient";
  clientPattern: string;
  targetDomain: string;
  internal: boolean;
}

interface LinkPatternRecord {
  kind: "linkPattern";
  name: string;
  indicator: string;
  fromType: string;
  toType: string;
}

interface ValidationRuleRecord {
  kind: "validationRule";
  rule: string;
  scope: string;
}

type AnyRecord =
  | ExtractionRuleRecord
  | ExampleRecord
  | CustomTypeProposalRecord
  | HttpClientRecord
  | LinkPatternRecord
  | ValidationRuleRecord;

// ─── Output Types ─────────────────────────────────────────────────────────────

interface ExtractionRuleOutput {
  location: string;
  classPattern: string;
  select: string;
  fields: Array<{ schemaField: string; source: string }>;
  exclude?: string[];
  examples?: { matches: string[]; notMatches: string[] };
  overrides?: Record<string, {
    location?: string;
    classPattern?: string;
    select?: string;
    fields?: Array<{ schemaField: string; source: string }>;
  }>;
}

interface ComponentDefinitions {
  version: string;
  extractionRules: Record<string, ExtractionRuleOutput>;
  customTypeProposals: Array<{ name: string; pattern: string; instanceCount?: number }>;
  customTypes: unknown[];
}

interface LinkingRules {
  version: string;
  httpClients: Array<{ clientPattern: string; targetDomain: string; internal: boolean }>;
  linkPatterns: Array<{ name: string; indicator: string; fromType: string; toType: string }>;
  validationRules: Array<{ rule: string; scope: string }>;
}

// ─── Read and parse JSONL files ───────────────────────────────────────────────

function readJsonlFiles(): AnyRecord[] {
  const files = readdirSync(WORK_DIR).filter(
    (f) => f.startsWith("rules-") && f.endsWith(".jsonl")
  );

  if (files.length === 0) {
    console.error(`Error: No rules-*.jsonl files found in ${WORK_DIR}`);
    console.error("Run the configure subagents first.");
    process.exit(1);
  }

  console.log(`Found ${files.length} rules file(s):`);
  for (const f of files) console.log(`  ${f}`);

  const records: AnyRecord[] = [];
  let malformed = 0;

  for (const file of files) {
    const lines = readFileSync(resolve(WORK_DIR, file), "utf8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      try {
        const obj = JSON.parse(line);
        if (obj && typeof obj.kind === "string") {
          records.push(obj as AnyRecord);
        }
      } catch {
        malformed++;
        console.warn(`  Warning: malformed JSON at ${file}:${i + 1} — skipped`);
      }
    }
  }

  console.log(`\nParsed ${records.length} records (${malformed} malformed skipped)`);
  return records;
}

// ─── Merge extraction rules ───────────────────────────────────────────────────
//
// Strategy:
//   1. Group records by componentType, then by repo
//   2. For each type, find the most common classPattern (base rule)
//   3. Repos whose classPattern differs from the base become overrides
//   4. Fields, location, select from the base rule are used as-is
//   5. exclude lists are merged (union) across all repos
//   6. examples: up to 2 matching + 2 non-matching snippets kept

function mergeExtractionRules(
  rules: ExtractionRuleRecord[],
  examples: ExampleRecord[],
): Record<string, ExtractionRuleOutput> {
  // Group rules by componentType → repo
  const byType = new Map<string, Map<string, ExtractionRuleRecord>>();
  for (const rule of rules) {
    if (!byType.has(rule.componentType)) byType.set(rule.componentType, new Map());
    byType.get(rule.componentType)!.set(rule.repo, rule);
  }

  // Group examples by componentType
  const exByType = new Map<string, { matches: string[]; notMatches: string[] }>();
  for (const ex of examples) {
    if (!exByType.has(ex.componentType)) {
      exByType.set(ex.componentType, { matches: [], notMatches: [] });
    }
    const bucket = exByType.get(ex.componentType)!;
    if (ex.matches && bucket.matches.length < 2) bucket.matches.push(ex.snippet);
    if (!ex.matches && bucket.notMatches.length < 2) bucket.notMatches.push(ex.snippet);
  }

  const output: Record<string, ExtractionRuleOutput> = {};

  for (const [componentType, repoRules] of byType) {
    const repoEntries = [...repoRules.entries()];

    // Find most common classPattern
    const patternCounts = new Map<string, string[]>(); // pattern → repos
    for (const [repo, rule] of repoEntries) {
      const p = rule.classPattern;
      if (!patternCounts.has(p)) patternCounts.set(p, []);
      patternCounts.get(p)!.push(repo);
    }

    // Sort by count descending, then alphabetically for determinism
    const sorted = [...patternCounts.entries()].sort((a, b) =>
      b[1].length - a[1].length || a[0].localeCompare(b[0])
    );
    const [, baseRepoNames] = sorted[0];
    const baseRepo = baseRepoNames[0];
    const baseRule = repoRules.get(baseRepo)!;

    // Merge exclude across all repos (union, deduplicated)
    const excludeSet = new Set<string>();
    for (const [, rule] of repoEntries) {
      for (const ex of rule.exclude ?? []) excludeSet.add(ex);
    }

    // Build overrides for repos whose classPattern or location differ from base
    const overrides: Record<string, {
      location?: string;
      classPattern?: string;
      select?: string;
      fields?: Array<{ schemaField: string; source: string }>;
    }> = {};

    for (const [repo, rule] of repoEntries) {
      if (repo === baseRepo) continue;
      const diff: typeof overrides[string] = {};
      if (rule.classPattern !== baseRule.classPattern) diff.classPattern = rule.classPattern;
      if (rule.location !== baseRule.location) diff.location = rule.location;
      if (rule.select !== baseRule.select) diff.select = rule.select;
      if (JSON.stringify(rule.fields) !== JSON.stringify(baseRule.fields)) diff.fields = rule.fields;
      if (Object.keys(diff).length > 0) overrides[repo] = diff;
    }

    // Examples for this type
    const exGroup = exByType.get(componentType);
    const hasExamples = exGroup && (exGroup.matches.length > 0 || exGroup.notMatches.length > 0);

    output[componentType] = {
      location: baseRule.location,
      classPattern: baseRule.classPattern,
      select: baseRule.select,
      fields: baseRule.fields,
      ...(excludeSet.size > 0 ? { exclude: [...excludeSet] } : {}),
      ...(hasExamples ? { examples: exGroup } : {}),
      ...(Object.keys(overrides).length > 0 ? { overrides } : {}),
    };
  }

  return output;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log("Building component-definitions.json and linking-rules.json...\n");
console.log(`Project root: ${PROJECT_ROOT}`);
if (DRY_RUN) console.log("DRY RUN — no files will be written\n");

const allRecords = readJsonlFiles();

// Partition by kind
const extractionRules = allRecords.filter((r): r is ExtractionRuleRecord => r.kind === "extractionRule");
const examples = allRecords.filter((r): r is ExampleRecord => r.kind === "example");
const proposals = allRecords.filter((r): r is CustomTypeProposalRecord => r.kind === "customTypeProposal");
const httpClients = allRecords.filter((r): r is HttpClientRecord => r.kind === "httpClient");
const linkPatterns = allRecords.filter((r): r is LinkPatternRecord => r.kind === "linkPattern");
const validationRules = allRecords.filter((r): r is ValidationRuleRecord => r.kind === "validationRule");

console.log(`\nRecord breakdown:`);
console.log(`  extractionRule:     ${extractionRules.length}`);
console.log(`  example:            ${examples.length}`);
console.log(`  customTypeProposal: ${proposals.length}`);
console.log(`  httpClient:         ${httpClients.length}`);
console.log(`  linkPattern:        ${linkPatterns.length}`);
console.log(`  validationRule:     ${validationRules.length}`);

// ── Build component-definitions.json ──────────────────────────────────────────

const mergedRules = mergeExtractionRules(extractionRules, examples);

// Deduplicate custom type proposals by name (keep highest instanceCount)
const proposalsByName = new Map<string, CustomTypeProposalRecord>();
for (const p of proposals) {
  const existing = proposalsByName.get(p.name);
  if (!existing || (p.instanceCount ?? 0) > (existing.instanceCount ?? 0)) {
    proposalsByName.set(p.name, p);
  }
}
const mergedProposals = [...proposalsByName.values()].map(({ name, pattern, instanceCount }) => ({
  name,
  pattern,
  ...(instanceCount !== undefined ? { instanceCount } : {}),
}));

// Preserve existing customTypes if file already exists (don't overwrite user decisions)
let existingCustomTypes: unknown[] = [];
if (existsSync(DEFS_OUT)) {
  try {
    const existing = JSON.parse(readFileSync(DEFS_OUT, "utf8"));
    existingCustomTypes = existing.customTypes ?? [];
    if (existingCustomTypes.length > 0) {
      console.log(`\nPreserving ${existingCustomTypes.length} existing customTypes from prior run.`);
    }
  } catch { /* start fresh if parse fails */ }
}

const componentDefs: ComponentDefinitions = {
  version: "1.0",
  extractionRules: mergedRules,
  customTypeProposals: mergedProposals,
  customTypes: existingCustomTypes,
};

// ── Build linking-rules.json ──────────────────────────────────────────────────

// Deduplicate by key field
const clientMap = new Map<string, HttpClientRecord>();
for (const c of httpClients) clientMap.set(c.clientPattern, c);

const patternMap = new Map<string, LinkPatternRecord>();
for (const p of linkPatterns) patternMap.set(p.name, p);

const ruleMap = new Map<string, ValidationRuleRecord>();
for (const r of validationRules) ruleMap.set(r.rule, r);

const linkingRules: LinkingRules = {
  version: "1.0",
  httpClients: [...clientMap.values()].map(({ clientPattern, targetDomain, internal }) => ({
    clientPattern, targetDomain, internal,
  })),
  linkPatterns: [...patternMap.values()].map(({ name, indicator, fromType, toType }) => ({
    name, indicator, fromType, toType,
  })),
  validationRules: [...ruleMap.values()].map(({ rule, scope }) => ({ rule, scope })),
};

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${"═".repeat(60)}`);
console.log(`  BUILD SUMMARY`);
console.log(`${"═".repeat(60)}`);
console.log(`  Component types:     ${Object.keys(mergedRules).join(", ") || "none"}`);

for (const [type, rule] of Object.entries(mergedRules)) {
  const overrideCount = Object.keys(rule.overrides ?? {}).length;
  const overrideNote = overrideCount > 0 ? ` (${overrideCount} repo override${overrideCount > 1 ? "s" : ""})` : "";
  console.log(`    ${type.padEnd(14)} classPattern: ${rule.classPattern}${overrideNote}`);
}

if (mergedProposals.length > 0) {
  console.log(`\n  Custom type proposals (${mergedProposals.length} — review and add to customTypes):`);
  for (const p of mergedProposals) {
    const count = p.instanceCount !== undefined ? ` (${p.instanceCount} instances)` : "";
    console.log(`    • ${p.name}: ${p.pattern}${count}`);
  }
} else {
  console.log(`\n  Custom type proposals: none`);
}

console.log(`\n  Linking rules:`);
console.log(`    HTTP clients:     ${clientMap.size}`);
console.log(`    Link patterns:    ${patternMap.size}`);
console.log(`    Validation rules: ${ruleMap.size}`);
console.log(`${"═".repeat(60)}`);

// ── Write output ──────────────────────────────────────────────────────────────

if (!DRY_RUN) {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });

  writeFileSync(DEFS_OUT, JSON.stringify(componentDefs, null, 2) + "\n", "utf8");
  console.log(`\n✓ Written: ${DEFS_OUT}`);

  writeFileSync(LINKS_OUT, JSON.stringify(linkingRules, null, 2) + "\n", "utf8");
  console.log(`✓ Written: ${LINKS_OUT}`);
} else {
  console.log(`\nDRY RUN — would write:`);
  console.log(`  ${DEFS_OUT}`);
  console.log(`  ${LINKS_OUT}`);
}
