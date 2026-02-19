#!/usr/bin/env bun
/**
 * validate-graph — PostToolUse hook for riviere-cli
 *
 * Fires after every `riviere builder` command and validates the graph
 * at a depth that scales with the current phase.
 *
 * Phase detection (automatic from graph state):
 *   Extract — components exist, no links yet        → structural + type-field checks
 *   Connect — links exist                            → + link referential integrity
 *   Annotate — one or more DomainOps are enriched     → + enrichment quality checks
 *   Validate — command was check-consistency/validate → + orphan threshold analysis
 *
 * Hook registration (.claude/settings.json):
 *   {
 *     "hooks": {
 *       "PostToolUse": [
 *         {
 *           "matcher": "Bash",
 *           "hooks": [{ "type": "command", "command": "bun /path/to/validate-graph.ts" }]
 *         }
 *       ]
 *     }
 *   }
 *
 * Exit codes:
 *   0 — valid (or warnings only — Claude may continue)
 *   2 — errors found (Claude must fix before continuing)
 */

import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, resolve } from "path";
import { spawnSync } from "child_process";

// ─── Help ─────────────────────────────────────────────────────────────────────

const HELP = `
validate-graph — PostToolUse hook for riviere-cli

Fires after every riviere builder command and validates the graph
at a depth that scales with the current phase.

Phase detection (automatic from graph state):
  Extract   — components exist, no links yet     → structural + type-field checks
  Connect   — links exist                        → + link referential integrity
  Annotate  — one or more DomainOps enriched     → + enrichment quality checks
  Validate  — command was check-consistency      → + orphan threshold analysis

USAGE
  bun validate-graph.ts [options]

  Designed to run as a PostToolUse hook (reads JSON from stdin).
  Can also be invoked directly for manual validation.

OPTIONS
  --help, -h    Show this help

EXIT CODES
  0 — valid (or warnings only)
  2 — errors found (must fix before continuing)
`.trim();

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface HookInput {
  tool_name: string;
  tool_input: { command?: string };
  tool_response: {
    exit_code?: number;
    exitCode?: number;
    output?: string;
    stdout?: string;
  };
}

interface SourceLocation {
  repository: string;
  filePath: string;
  lineNumber?: number;
}

interface DomainEntry {
  name: string;
  description?: string;
  systemType?: string;
}

interface Component {
  id: string;
  type: string;
  name: string;
  domain: string;
  module: string;
  sourceLocation?: SourceLocation;
  // API
  apiType?: string;
  httpMethod?: string;
  path?: string;
  operationName?: string;
  // Event
  eventName?: string;
  // EventHandler
  subscribedEvents?: string[];
  // UI
  route?: string;
  // DomainOp enrichment
  stateChanges?: Array<{ from: string[]; to: string[] }>;
  businessRules?: string[];
  behavior?: Array<{
    reads?: string[];
    validates?: string[];
    modifies?: string[];
    emits?: string[];
  }>;
  // Custom
  customType?: string;
}

interface Link {
  source: string;
  target: string;
  type?: string;
}

interface Graph {
  version?: string;
  metadata?: {
    sources?: string[];
    domains?: DomainEntry[];
  };
  components?: Component[];
  links?: Link[];
  externalLinks?: Link[];
}

// ─── Read hook stdin ──────────────────────────────────────────────────────────

let hook: HookInput;
try {
  const raw = await Bun.stdin.text();
  if (!raw.trim()) process.exit(0);
  hook = JSON.parse(raw);
} catch {
  process.exit(0); // Not a hook call — don't interfere
}

// Only intercept Bash tool calls
if (hook.tool_name !== "Bash") process.exit(0);

const command: string = hook.tool_input?.command ?? "";

// Only validate after riviere builder commands
if (!command.includes("riviere builder")) process.exit(0);

// Skip if the CLI command itself failed — there's nothing valid to check
const exitCode =
  hook.tool_response?.exit_code ??
  hook.tool_response?.exitCode ??
  0;
if (exitCode !== 0) process.exit(0);

// Detect whether this was a read-only validation command (used for phase detection)
const isConsistencyCheck =
  command.includes("check-consistency") || command.includes(" validate");

// ─── Locate and parse graph ───────────────────────────────────────────────────

function findGraphFile(): string | null {
  const dir = resolve(".riviere");
  if (!existsSync(dir)) return null;

  const candidates = readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("step-"))
    .map((f) => join(dir, f))
    .filter((p) => {
      try {
        const parsed = JSON.parse(readFileSync(p, "utf8"));
        return "components" in parsed;
      } catch {
        return false;
      }
    });

  if (candidates.length === 0) return null;

  // Most recently modified wins
  return candidates.sort(
    (a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs
  )[0];
}

const graphPath = findGraphFile();
if (!graphPath) process.exit(0); // Graph not yet created — nothing to validate

let graph: Graph;
try {
  graph = JSON.parse(readFileSync(graphPath, "utf8"));
} catch {
  process.exit(0);
}

// ─── Phase detection ──────────────────────────────────────────────────────────

function detectPhase(graph: Graph): 3 | 4 | 5 | 6 {
  if (isConsistencyCheck) return 6;

  const components = graph.components ?? [];
  const links = graph.links ?? [];

  // Annotate: at least one DomainOp has enrichment data
  const hasEnrichedDomainOp = components.some(
    (c) =>
      c.type === "DomainOp" &&
      ((c.stateChanges && c.stateChanges.length > 0) ||
        (c.businessRules && c.businessRules.length > 0) ||
        (c.behavior && c.behavior.length > 0))
  );
  if (hasEnrichedDomainOp) return 5;

  // Connect: links exist
  if (links.length > 0) return 4;

  // Extract (default)
  return 3;
}

const phase = detectPhase(graph);

// ─── Findings ────────────────────────────────────────────────────────────────

type Severity = "error" | "warning";

interface Finding {
  severity: Severity;
  location: string;
  message: string;
}

const findings: Finding[] = [];

function error(location: string, message: string): void {
  findings.push({ severity: "error", location, message });
}

function warn(location: string, message: string): void {
  findings.push({ severity: "warning", location, message });
}

// ─── Extract: Structural + semantic validation ────────────────────────────────

function validatePhase3(graph: Graph): void {
  // Root-level fields
  if (!graph.version) {
    error("graph", "Missing required field: version");
  }

  const meta = graph.metadata;
  if (!meta) {
    error("graph", "Missing required field: metadata");
  } else {
    if (!meta.sources || meta.sources.length === 0) {
      warn("graph.metadata.sources", "No source repositories defined");
    }

    // Domain entries
    const validSystemTypes = new Set(["domain", "bff", "ui", "other"]);
    const domains = meta.domains ?? [];

    for (const d of domains) {
      const dloc = `domain:${d.name ?? "(unnamed)"}`;
      if (!d.name) error(dloc, "Domain missing required field: name");
      if (!d.description) error(dloc, "Domain missing required field: description");
      if (!d.systemType) {
        error(dloc, "Domain missing required field: systemType");
      } else if (!validSystemTypes.has(d.systemType)) {
        error(
          dloc,
          `Invalid systemType "${d.systemType}" — must be one of: ${[...validSystemTypes].join(", ")}`
        );
      }
    }
  }

  const components = graph.components ?? [];
  if (components.length === 0) {
    warn("graph.components", "No components found in graph");
    return;
  }

  const validTypes = new Set([
    "API", "UseCase", "DomainOp", "Event", "EventHandler", "UI", "Custom",
  ]);
  const validHttpMethods = new Set([
    "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS",
  ]);
  const knownDomains = new Set(
    (graph.metadata?.domains ?? []).map((d) => d.name).filter(Boolean)
  );
  const seenIds = new Set<string>();

  for (const comp of components) {
    const loc = comp.id ?? `component(name=${comp.name ?? "?"})`;

    // Required fields
    if (!comp.id) {
      error(loc, "Missing required field: id");
      continue; // Cannot validate further without an ID
    }
    if (!comp.type) error(loc, "Missing required field: type");
    if (!comp.name) error(loc, "Missing required field: name");
    if (!comp.domain) error(loc, "Missing required field: domain");
    if (!comp.module) error(loc, "Missing required field: module");

    if (!comp.sourceLocation) {
      error(loc, "Missing required field: sourceLocation");
    } else {
      if (!comp.sourceLocation.repository) {
        error(loc, "sourceLocation missing required field: repository");
      }
      if (!comp.sourceLocation.filePath) {
        error(loc, "sourceLocation missing required field: filePath");
      }
    }

    // Duplicate ID check
    if (seenIds.has(comp.id)) {
      error(loc, `Duplicate component ID: ${comp.id}`);
    }
    seenIds.add(comp.id);

    // ID format: {domain}:{module}:{type-lowercase}:{name}[:{lineNumber}]
    const parts = comp.id.split(":");
    if (parts.length < 4) {
      error(
        loc,
        `Malformed ID — expected {domain}:{module}:{type}:{name}, got: ${comp.id}`
      );
    } else {
      const [idDomain, idModule, idType] = parts;
      if (comp.domain && idDomain !== comp.domain) {
        error(
          loc,
          `ID domain "${idDomain}" does not match component domain "${comp.domain}"`
        );
      }
      if (comp.module && idModule !== comp.module) {
        error(
          loc,
          `ID module "${idModule}" does not match component module "${comp.module}"`
        );
      }
      if (comp.type && idType !== comp.type.toLowerCase()) {
        error(
          loc,
          `ID type segment "${idType}" does not match component type "${comp.type.toLowerCase()}"`
        );
      }
    }

    // Type validity
    if (comp.type && !validTypes.has(comp.type)) {
      error(
        loc,
        `Unknown component type "${comp.type}" — must be one of: ${[...validTypes].join(", ")}`
      );
    }

    // Domain cross-reference (only when registry is populated)
    if (knownDomains.size > 0 && comp.domain && !knownDomains.has(comp.domain)) {
      warn(
        loc,
        `Component domain "${comp.domain}" not registered in graph domains`
      );
    }

    // Type-specific required fields
    switch (comp.type) {
      case "API": {
        if (!comp.apiType) {
          error(loc, "API component missing required field: apiType");
        } else if (comp.apiType === "REST") {
          if (!comp.httpMethod) {
            error(loc, "REST API missing required field: httpMethod");
          } else if (!validHttpMethods.has(comp.httpMethod)) {
            error(
              loc,
              `Invalid httpMethod "${comp.httpMethod}" — must be one of: ${[...validHttpMethods].join(", ")}`
            );
          }
          if (!comp.path) error(loc, "REST API missing required field: path");
        } else if (comp.apiType === "GraphQL") {
          if (!comp.operationName) {
            error(loc, "GraphQL API missing required field: operationName");
          }
        }
        break;
      }
      case "DomainOp": {
        if (!comp.operationName) {
          error(loc, "DomainOp missing required field: operationName");
        }
        break;
      }
      case "Event": {
        if (!comp.eventName) {
          error(loc, "Event missing required field: eventName");
        }
        break;
      }
      case "EventHandler": {
        if (!comp.subscribedEvents || comp.subscribedEvents.length === 0) {
          error(loc, "EventHandler missing or empty required field: subscribedEvents");
        }
        break;
      }
      case "UI": {
        if (!comp.route) {
          error(loc, "UI component missing required field: route");
        }
        break;
      }
      case "Custom": {
        if (!comp.customType) {
          error(loc, "Custom component missing required field: customType");
        }
        break;
      }
    }
  }
}

// ─── Connect: Link integrity ──────────────────────────────────────────────────

function validatePhase4(graph: Graph): void {
  const links = graph.links ?? [];
  const componentIds = new Set((graph.components ?? []).map((c) => c.id));
  const validLinkTypes = new Set(["sync", "async"]);

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const loc = `link[${i}]`;

    if (!link.source) error(loc, "Link missing required field: source");
    if (!link.target) error(loc, "Link missing required field: target");

    if (!link.type) {
      error(loc, "Link missing required field: type");
    } else if (!validLinkTypes.has(link.type)) {
      error(
        loc,
        `Invalid link type "${link.type}" — must be one of: ${[...validLinkTypes].join(", ")}`
      );
    }

    if (link.source && link.target) {
      if (link.source === link.target) {
        error(loc, `Self-referential link: source and target are the same (${link.source})`);
      }
      if (!componentIds.has(link.source)) {
        error(loc, `Link source references unknown component: ${link.source}`);
      }
      if (!componentIds.has(link.target)) {
        error(loc, `Link target references unknown component: ${link.target}`);
      }
    }
  }
}

// ─── Annotate: Enrichment quality ─────────────────────────────────────────────

function validatePhase5(graph: Graph): void {
  const domainOps = (graph.components ?? []).filter((c) => c.type === "DomainOp");

  for (const op of domainOps) {
    const loc = op.id;

    if (op.stateChanges) {
      for (let i = 0; i < op.stateChanges.length; i++) {
        const sc = op.stateChanges[i];
        const scLoc = `${loc}.stateChanges[${i}]`;

        if (!sc.from || sc.from.length === 0) {
          error(scLoc, "stateChange missing or empty field: from");
        } else {
          for (const s of sc.from) {
            if (!s || s.trim() === "") error(scLoc, "stateChange.from contains empty string");
          }
        }

        if (!sc.to || sc.to.length === 0) {
          error(scLoc, "stateChange missing or empty field: to");
        } else {
          for (const s of sc.to) {
            if (!s || s.trim() === "") error(scLoc, "stateChange.to contains empty string");
          }
        }
      }
    }

    if (op.businessRules) {
      for (let i = 0; i < op.businessRules.length; i++) {
        const rule = op.businessRules[i];
        if (!rule || rule.trim() === "") {
          error(`${loc}.businessRules[${i}]`, "businessRule is an empty string");
        }
      }
    }

    if (op.behavior) {
      for (let i = 0; i < op.behavior.length; i++) {
        const entry = op.behavior[i];
        const bLoc = `${loc}.behavior[${i}]`;
        for (const field of ["reads", "validates", "modifies", "emits"] as const) {
          const arr = entry[field];
          if (arr) {
            for (const val of arr) {
              if (!val || val.trim() === "") {
                error(`${bLoc}.${field}`, `behavior.${field} contains empty string`);
              }
            }
          }
        }
      }
    }
  }
}

// ─── Validate: Orphan threshold ────────────────────────────────────────────────

function validatePhase6(): void {
  // Skip redundant re-run if the hook fired from check-consistency itself
  if (isConsistencyCheck) return;

  const result = spawnSync(
    "npx",
    ["riviere", "builder", "check-consistency", "--json"],
    { encoding: "utf8", timeout: 30_000 }
  );

  if (result.error || result.status !== 0) {
    warn("orphan-check", "check-consistency unavailable — skipping orphan analysis");
    return;
  }

  let data: { orphans?: Array<{ id: string; type: string }> };
  try {
    data = JSON.parse(result.stdout);
  } catch {
    warn("orphan-check", "check-consistency returned unparseable output");
    return;
  }

  const orphans = data.orphans ?? [];
  const total = (graph.components ?? []).length;

  if (total > 0 && orphans.length > 0) {
    const pct = Math.round((orphans.length / total) * 100);
    const msg =
      pct > 20
        ? `High orphan rate: ${orphans.length}/${total} (${pct}%) — likely systematic linking failure in Step 4`
        : `${orphans.length} orphaned component(s) — review connectivity`;
    warn("orphan-check", msg);
  }
}

// ─── Run checks ───────────────────────────────────────────────────────────────

validatePhase3(graph);
if (phase >= 4) validatePhase4(graph);
if (phase >= 5) validatePhase5(graph);
if (phase >= 6) validatePhase6();

// ─── Silent exit on clean graph ───────────────────────────────────────────────

if (findings.length === 0) process.exit(0);

// ─── Formatted output ─────────────────────────────────────────────────────────

const W = 70; // Inner content width (between the border pipes)
const HR = "─".repeat(W);

function row(text: string): string {
  // Truncate to fit inside the box
  const truncated = text.length > W - 2 ? text.slice(0, W - 5) + "..." : text;
  return `│ ${truncated.padEnd(W - 1)}│`;
}

const errors = findings.filter((f) => f.severity === "error");
const warnings = findings.filter((f) => f.severity === "warning");
const graphName = graphPath.split("/").pop() ?? "graph.json";

const out: string[] = [];
out.push(`┌${HR}┐`);
out.push(row(`riviere-validator  ·  Phase ${phase}  ·  ${graphName}`));
out.push(`├${HR}┤`);

if (errors.length > 0) {
  out.push(row(`✗  ${errors.length} error${errors.length !== 1 ? "s" : ""}`));
  for (const e of errors) {
    out.push(row(`   ✗ [${e.location}] ${e.message}`));
  }
}

if (warnings.length > 0) {
  if (errors.length > 0) out.push(`├${HR}┤`);
  out.push(row(`⚠  ${warnings.length} warning${warnings.length !== 1 ? "s" : ""}`));
  for (const w of warnings) {
    out.push(row(`   ⚠ [${w.location}] ${w.message}`));
  }
}

out.push(`└${HR}┘`);

const block = out.join("\n") + "\n";

if (errors.length > 0) {
  process.stderr.write(block);
  process.exit(2);
} else {
  process.stdout.write(block);
  process.exit(0);
}
