#!/usr/bin/env bun
/**
 * replay-staged-components
 *
 * Deterministically replays staged Step 3 component JSONL files, one command at a time.
 *
 * Default input pattern:
 *   .riviere/work/extract-*.jsonl
 *
 * Output report:
 *   .riviere/work/component-replay-report.json
 *
 * Exit codes:
 *   0 - all staged commands succeeded
 *   1 - invalid usage or filesystem error
 *   2 - one or more malformed/failed staged commands (report written)
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { spawnSync } from "child_process";

type ComponentType = "API" | "UseCase" | "DomainOp" | "Event" | "EventHandler" | "UI" | "Custom";

// Fields allowed at the top level of any component per the Riviere schema.
// Any other field the CLI writes must be migrated into metadata.
const SCHEMA_ALLOWED_TOP_LEVEL = new Set([
  "id", "type", "name", "domain", "module", "description", "sourceLocation", "metadata",
  "apiType", "httpMethod", "path", "route", "operationName", "entity",
  "eventName", "eventSchema", "subscribedEvents", "signature",
  "behavior", "stateChanges", "businessRules",
]);

/**
 * Moves any top-level fields not in the Riviere schema's allowed list into
 * the component's `metadata` object. This compensates for CLI commands that
 * write custom properties (e.g., --custom-type, --custom-property) at top
 * level instead of inside metadata.
 *
 * NOTE: Custom components are intentionally skipped — the CLI schema defines
 * Custom with `additionalProperties: true`, so extra top-level fields like
 * `customTypeName`, `noun`, `verbs`, etc. are valid and must NOT be moved.
 *
 * Returns the number of fields migrated.
 */
function migrateExtraFieldsToMetadata(graphPath: string): number {
  let graph: { components?: Array<Record<string, unknown>> };
  try {
    graph = JSON.parse(readFileSync(graphPath, "utf8"));
  } catch {
    return 0;
  }

  let migrated = 0;
  for (const comp of graph.components ?? []) {
    // Custom components have additionalProperties: true — extra fields are valid at top level.
    if (comp["type"] === "Custom") continue;

    const extra = Object.keys(comp).filter((k) => !SCHEMA_ALLOWED_TOP_LEVEL.has(k));
    if (extra.length === 0) continue;

    const metadata = (comp["metadata"] as Record<string, unknown> | undefined) ?? {};
    for (const field of extra) {
      metadata[field] = comp[field];
      delete comp[field];
      migrated++;
    }
    comp["metadata"] = metadata;
  }

  if (migrated > 0) {
    writeFileSync(graphPath, JSON.stringify(graph, null, 2) + "\n", "utf8");
  }

  return migrated;
}

interface StagedComponent {
  type: ComponentType;
  domain: string;
  module: string;
  name: string;
  repository: string;
  filePath: string;
  lineNumber: number;
  // API-specific
  apiType?: string;
  httpMethod?: string;
  httpPath?: string;
  // DomainOp / GraphQL
  operationName?: string;
  entity?: string;
  // Event
  eventName?: string;
  eventSchema?: string;
  // EventHandler
  subscribedEvents?: string[];
  // UI
  route?: string;
  // Custom
  customType?: string;
  customProperties?: Record<string, string>;
}

interface ReplayFailure {
  file: string;
  line: number;
  reason: string;
  command?: unknown;
  stdout?: string;
  stderr?: string;
}

interface ReplayReport {
  generatedAt: string;
  workDir: string;
  graphPath?: string;
  dryRun: boolean;
  filesProcessed: string[];
  linesTotal: number;
  commandsAttempted: number;
  commandsSucceeded: number;
  byType: Record<string, number>;
  failures: ReplayFailure[];
}

const VALID_TYPES = new Set<string>([
  "API", "UseCase", "DomainOp", "Event", "EventHandler", "UI", "Custom",
]);

const HELP = `
replay-staged-components

USAGE
  bun tools/replay-staged-components.ts [options]

OPTIONS
  --work-dir <path>        Directory containing extract-*.jsonl (default: .riviere/work)
  --graph <path>           Override graph path passed to riviere CLI
  --project-root <path>    Resolve .riviere/ paths relative to this directory (default: cwd)
  --dry-run                Print commands without executing
  --help, -h               Show this help
`.trim();

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNonEmptyString(obj: Record<string, unknown>, key: string): string | null {
  const value = obj[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asOptionalString(obj: Record<string, unknown>, key: string): string | null {
  const value = obj[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStringArray(obj: Record<string, unknown>, key: string): string[] {
  const value = obj[key];
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim() !== "");
}

function parseStagedComponent(
  raw: unknown
): { ok: true; value: StagedComponent } | { ok: false; error: string } {
  if (!isObject(raw)) return { ok: false, error: "line is not a JSON object" };

  const type = asNonEmptyString(raw, "type");
  if (!type || !VALID_TYPES.has(type)) {
    return { ok: false, error: `invalid or missing type: ${type ?? "null"} (expected: ${[...VALID_TYPES].join(", ")})` };
  }

  const domain = asNonEmptyString(raw, "domain");
  const module_ = asNonEmptyString(raw, "module");
  const name = asNonEmptyString(raw, "name");
  const repository = asNonEmptyString(raw, "repository");
  const filePath = asNonEmptyString(raw, "filePath");
  const lineNumber = typeof raw.lineNumber === "number" ? raw.lineNumber : null;

  if (!domain || !module_ || !name || !repository || !filePath || lineNumber === null) {
    const missing = [
      !domain && "domain",
      !module_ && "module",
      !name && "name",
      !repository && "repository",
      !filePath && "filePath",
      lineNumber === null && "lineNumber",
    ].filter(Boolean);
    return { ok: false, error: `missing required field(s): ${missing.join(", ")}` };
  }

  const result: StagedComponent = {
    type: type as ComponentType,
    domain,
    module: module_,
    name,
    repository,
    filePath,
    lineNumber,
  };

  // Type-specific optional fields
  result.apiType = asOptionalString(raw, "apiType") ?? undefined;
  result.httpMethod = asOptionalString(raw, "httpMethod") ?? undefined;
  result.httpPath = asOptionalString(raw, "httpPath") ?? undefined;
  result.operationName = asOptionalString(raw, "operationName") ?? undefined;
  result.entity = asOptionalString(raw, "entity") ?? undefined;
  result.eventName = asOptionalString(raw, "eventName") ?? undefined;
  result.eventSchema = asOptionalString(raw, "eventSchema") ?? undefined;
  result.route = asOptionalString(raw, "route") ?? undefined;
  result.customType = asOptionalString(raw, "customType") ?? undefined;

  const subEvents = asStringArray(raw, "subscribedEvents");
  if (subEvents.length > 0) result.subscribedEvents = subEvents;

  // Custom properties: Record<string, string> flattened to key:value pairs
  if (isObject(raw.customProperties)) {
    const props: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw.customProperties as Record<string, unknown>)) {
      if (typeof v === "string") props[k] = v;
    }
    if (Object.keys(props).length > 0) result.customProperties = props;
  }

  return { ok: true, value: result };
}

function toCliArgs(cmd: StagedComponent, graphPath?: string): string[] {
  const args = [
    "riviere", "builder", "add-component",
    "--type", cmd.type,
    "--domain", cmd.domain,
    "--module", cmd.module,
    "--name", cmd.name,
    "--repository", cmd.repository,
    "--file-path", cmd.filePath,
    "--line-number", String(cmd.lineNumber),
  ];

  // API-specific
  if (cmd.apiType) args.push("--api-type", cmd.apiType);
  if (cmd.httpMethod) args.push("--http-method", cmd.httpMethod);
  if (cmd.httpPath) args.push("--http-path", cmd.httpPath);

  // DomainOp / GraphQL
  if (cmd.entity) args.push("--entity", cmd.entity);
  if (cmd.operationName) args.push("--operation-name", cmd.operationName);

  // Event
  if (cmd.eventName) args.push("--event-name", cmd.eventName);
  if (cmd.eventSchema) args.push("--event-schema", cmd.eventSchema);

  // EventHandler
  if (cmd.subscribedEvents) {
    args.push("--subscribed-events", cmd.subscribedEvents.join(","));
  }

  // UI
  if (cmd.route) args.push("--route", cmd.route);

  // Custom
  if (cmd.customType) args.push("--custom-type", cmd.customType);
  if (cmd.customProperties) {
    for (const [k, v] of Object.entries(cmd.customProperties)) {
      args.push("--custom-property", `${k}:${v}`);
    }
  }

  if (graphPath) args.push("--graph", graphPath);
  return args;
}

function main(): void {
  if (hasFlag("--help") || hasFlag("-h")) {
    console.log(HELP);
    return;
  }

  // --project-root: resolve .riviere/ paths relative to this directory (default: cwd)
  const PROJECT_ROOT = resolve(argValue("--project-root") ?? ".");

  const workDir = argValue("--work-dir")
    ? resolve(argValue("--work-dir")!)
    : resolve(PROJECT_ROOT, ".riviere/work");
  const graphPath = argValue("--graph") ?? resolve(PROJECT_ROOT, ".riviere/graph.json");
  const dryRun = hasFlag("--dry-run");

  if (!existsSync(workDir)) {
    console.error(`Work directory not found: ${workDir}`);
    process.exit(1);
  }

  const stagedFiles = readdirSync(workDir)
    .filter((f) => /^extract-.*\.jsonl$/.test(f))
    .sort();

  if (stagedFiles.length === 0) {
    console.log(`No staged component files found in ${workDir} (pattern: extract-*.jsonl)`);
    return;
  }

  const report: ReplayReport = {
    generatedAt: new Date().toISOString(),
    workDir,
    graphPath: graphPath ? resolve(graphPath) : undefined,
    dryRun,
    filesProcessed: stagedFiles.map((f) => join(workDir, f)),
    linesTotal: 0,
    commandsAttempted: 0,
    commandsSucceeded: 0,
    byType: {},
    failures: [],
  };

  for (const fileName of stagedFiles) {
    const fullPath = join(workDir, fileName);
    const lines = readFileSync(fullPath, "utf8")
      .split("\n")
      .map((l) => l.trim());

    for (let i = 0; i < lines.length; i++) {
      const lineNo = i + 1;
      const line = lines[i];
      if (!line || line.startsWith("#")) continue;

      report.linesTotal++;

      let raw: unknown;
      try {
        raw = JSON.parse(line);
      } catch (err) {
        report.failures.push({
          file: fullPath,
          line: lineNo,
          reason: `invalid JSON: ${String(err)}`,
        });
        continue;
      }

      const parsed = parseStagedComponent(raw);
      if (!parsed.ok) {
        report.failures.push({
          file: fullPath,
          line: lineNo,
          reason: parsed.error,
          command: raw,
        });
        continue;
      }

      report.commandsAttempted++;
      const args = toCliArgs(parsed.value, graphPath);
      const rendered = `npx ${args.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(" ")}`;

      if (dryRun) {
        console.log(rendered);
        report.commandsSucceeded++;
        report.byType[parsed.value.type] = (report.byType[parsed.value.type] ?? 0) + 1;
        continue;
      }

      const res = spawnSync("npx", args, { encoding: "utf8" });
      if ((res.status ?? 1) === 0) {
        report.commandsSucceeded++;
        report.byType[parsed.value.type] = (report.byType[parsed.value.type] ?? 0) + 1;
      } else {
        report.failures.push({
          file: fullPath,
          line: lineNo,
          reason: `CLI failed (exit ${(res.status ?? -1).toString()})`,
          command: raw,
          stdout: res.stdout ?? "",
          stderr: res.stderr ?? "",
        });
      }
    }
  }

  // ── Schema compliance ────────────────────────────────────────────────────────
  // The CLI may write custom properties as top-level fields. Migrate any
  // non-schema fields into metadata, then validate the final graph.
  if (!dryRun && existsSync(graphPath)) {
    const migrated = migrateExtraFieldsToMetadata(graphPath);
    if (migrated > 0) {
      console.log(
        `\nSchema cleanup: migrated ${migrated} extra top-level field(s) into metadata.`
      );
    }

    const validateRes = spawnSync(
      "npx",
      ["riviere", "builder", "validate", "--graph", graphPath],
      { encoding: "utf8" }
    );
    if ((validateRes.status ?? 1) !== 0) {
      report.failures.push({
        file: graphPath,
        line: -1,
        reason: `Schema validation failed after component replay (exit ${validateRes.status ?? -1})`,
        stdout: validateRes.stdout ?? "",
        stderr: validateRes.stderr ?? "",
      });
      console.error("\nSchema validation FAILED — graph has remaining violations:");
      console.error(validateRes.stderr || validateRes.stdout || "(no output)");
    }
  }

  mkdirSync(workDir, { recursive: true });
  const reportPath = join(workDir, "component-replay-report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  const typeBreakdown = Object.entries(report.byType)
    .map(([t, n]) => `${t}: ${n}`)
    .join(", ");

  console.log(
    `Processed ${report.filesProcessed.length} file(s), ${report.linesTotal} staged line(s), ` +
      `${report.commandsSucceeded}/${report.commandsAttempted} command(s) succeeded.`
  );
  if (typeBreakdown) console.log(`By type: ${typeBreakdown}`);
  console.log(`Report: ${reportPath}`);

  if (report.failures.length > 0) {
    console.error(`Failures: ${report.failures.length}`);
    process.exit(2);
  }
}

main();
