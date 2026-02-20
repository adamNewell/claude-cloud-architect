#!/usr/bin/env bun
/**
 * replay-staged-enrichments
 *
 * Deterministically replays staged Step 5 enrichment JSONL files, one command at a time.
 *
 * Default input pattern:
 *   .riviere/work/annotate-staged-*.jsonl
 *
 * Output report:
 *   .riviere/work/enrich-replay-report.json
 *
 * Exit codes:
 *   0 - all staged commands succeeded
 *   1 - invalid usage or filesystem error
 *   2 - one or more malformed/failed staged commands (report written)
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { spawnSync } from "child_process";

interface StagedEnrichment {
  id: string;
  entity?: string;
  stateChanges?: string[];
  businessRules?: string[];
  reads?: string[];
  validates?: string[];
  modifies?: string[];
  emits?: string[];
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
  failures: ReplayFailure[];
}

const HELP = `
replay-staged-enrichments

USAGE
  bun tools/replay-staged-enrichments.ts [options]

OPTIONS
  --work-dir <path>        Directory containing annotate-staged-*.jsonl (default: .riviere/work)
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

function asStringArray(obj: Record<string, unknown>, key: string): string[] {
  const value = obj[key];
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim() !== "");
}

function parseStagedEnrichment(
  raw: unknown
): { ok: true; value: StagedEnrichment } | { ok: false; error: string } {
  if (!isObject(raw)) return { ok: false, error: "line is not a JSON object" };

  const id = asNonEmptyString(raw, "id");
  if (!id) return { ok: false, error: "missing required field: id" };

  return {
    ok: true,
    value: {
      id,
      entity: asNonEmptyString(raw, "entity") ?? undefined,
      stateChanges: asStringArray(raw, "stateChanges"),
      businessRules: asStringArray(raw, "businessRules"),
      reads: asStringArray(raw, "reads"),
      validates: asStringArray(raw, "validates"),
      modifies: asStringArray(raw, "modifies"),
      emits: asStringArray(raw, "emits"),
    },
  };
}

function toCliArgs(cmd: StagedEnrichment, graphPath?: string): string[] {
  const args = ["riviere", "builder", "enrich", "--id", cmd.id];

  if (cmd.entity) {
    args.push("--entity", cmd.entity);
  }

  for (const sc of cmd.stateChanges ?? []) {
    args.push("--state-change", sc);
  }

  for (const rule of cmd.businessRules ?? []) {
    args.push("--business-rule", rule);
  }

  for (const r of cmd.reads ?? []) {
    args.push("--reads", r);
  }

  for (const v of cmd.validates ?? []) {
    args.push("--validates", v);
  }

  for (const m of cmd.modifies ?? []) {
    args.push("--modifies", m);
  }

  for (const e of cmd.emits ?? []) {
    args.push("--emits", e);
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
  const graphPath = argValue("--graph");
  const dryRun = hasFlag("--dry-run");

  if (!existsSync(workDir)) {
    console.error(`Work directory not found: ${workDir}`);
    process.exit(1);
  }

  const stagedFiles = readdirSync(workDir)
    .filter((f) => /^annotate-staged-.*\.jsonl$/.test(f))
    .sort();

  if (stagedFiles.length === 0) {
    console.log(`No staged enrichment files found in ${workDir} (pattern: annotate-staged-*.jsonl)`);
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

      const parsed = parseStagedEnrichment(raw);
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
        continue;
      }

      const res = spawnSync("npx", args, { encoding: "utf8" });
      if ((res.status ?? 1) === 0) {
        report.commandsSucceeded++;
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

  mkdirSync(workDir, { recursive: true });
  const reportPath = join(workDir, "enrich-replay-report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(
    `Processed ${report.filesProcessed.length} file(s), ${report.linesTotal} staged line(s), ` +
      `${report.commandsSucceeded}/${report.commandsAttempted} command(s) succeeded.`
  );
  console.log(`Report: ${reportPath}`);

  if (report.failures.length > 0) {
    console.error(`Failures: ${report.failures.length}`);
    process.exit(2);
  }
}

main();
