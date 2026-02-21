#!/usr/bin/env bun
/**
 * replay-staged-links
 *
 * Deterministically replays staged Step 4 link JSONL files, one command at a time.
 *
 * Default input pattern:
 *   .riviere/work/link-staged-*.jsonl
 *
 * Output report:
 *   .riviere/work/link-replay-report.json
 *
 * Exit codes:
 *   0 - all staged commands succeeded
 *   1 - invalid usage or filesystem error
 *   2 - one or more malformed/failed staged commands (report written)
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { spawnSync } from "child_process";

type LinkType = "sync" | "async";
type TargetType = "UI" | "API" | "UseCase" | "DomainOp" | "Event" | "EventHandler" | "Custom";

interface LinkCommand {
  command: "link";
  from: string;
  toDomain: string;
  toModule: string;
  toType: TargetType;
  toName: string;
  linkType?: LinkType;
}

interface LinkHttpCommand {
  command: "link-http";
  path: string;
  method?: string;
  toDomain: string;
  toModule: string;
  toType: TargetType;
  toName: string;
  linkType?: LinkType;
}

interface LinkExternalCommand {
  command: "link-external";
  from: string;
  targetName: string;
  targetDomain?: string;
  targetUrl?: string;
  linkType?: LinkType;
}

type StagedCommand = LinkCommand | LinkHttpCommand | LinkExternalCommand;

interface ReplayFailure {
  file: string;
  line: number;
  reason: string;
  command?: unknown;
  stdout?: string;
  stderr?: string;
}

interface UrlWarning {
  file: string;
  line: number;
  originalValue: string;
  action: "stripped";
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
  urlWarnings: UrlWarning[];
}

const HELP = `
replay-staged-links

USAGE
  bun tools/replay-staged-links.ts [options]

OPTIONS
  --work-dir <path>        Directory containing link-staged-*.jsonl (default: .riviere/work)
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

function normalizeLinkType(value: string | null): LinkType {
  if (value === "async") return "async";
  return "sync";
}

/**
 * Returns true only for fully-qualified http/https URLs.
 * Rejects internal names, env var refs, MQTT, empty strings, etc.
 */
function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function parseStagedCommand(
  raw: unknown,
  location?: { file: string; line: number },
  urlWarnings?: UrlWarning[]
): { ok: true; value: StagedCommand } | { ok: false; error: string } {
  if (!isObject(raw)) return { ok: false, error: "line is not a JSON object" };

  const command = asNonEmptyString(raw, "command");
  if (!command) return { ok: false, error: "missing required field: command" };

  if (command === "link") {
    const from = asNonEmptyString(raw, "from");
    const toDomain = asNonEmptyString(raw, "toDomain");
    const toModule = asNonEmptyString(raw, "toModule");
    const toType = asNonEmptyString(raw, "toType");
    const toName = asNonEmptyString(raw, "toName");
    if (!from || !toDomain || !toModule || !toType || !toName) {
      return { ok: false, error: "link requires from,toDomain,toModule,toType,toName" };
    }
    return {
      ok: true,
      value: {
        command: "link",
        from,
        toDomain,
        toModule,
        toType: toType as TargetType,
        toName,
        linkType: normalizeLinkType(asOptionalString(raw, "linkType")),
      },
    };
  }

  if (command === "link-http") {
    const path = asNonEmptyString(raw, "path");
    const toDomain = asNonEmptyString(raw, "toDomain");
    const toModule = asNonEmptyString(raw, "toModule");
    const toType = asNonEmptyString(raw, "toType");
    const toName = asNonEmptyString(raw, "toName");
    if (!path || !toDomain || !toModule || !toType || !toName) {
      return { ok: false, error: "link-http requires path,toDomain,toModule,toType,toName" };
    }
    return {
      ok: true,
      value: {
        command: "link-http",
        path,
        method: asOptionalString(raw, "method") ?? undefined,
        toDomain,
        toModule,
        toType: toType as TargetType,
        toName,
        linkType: normalizeLinkType(asOptionalString(raw, "linkType")),
      },
    };
  }

  if (command === "link-external") {
    const from = asNonEmptyString(raw, "from");
    const targetName = asNonEmptyString(raw, "targetName");
    if (!from || !targetName) {
      return { ok: false, error: "link-external requires from,targetName" };
    }
    let targetUrl: string | undefined = asOptionalString(raw, "targetUrl") ?? undefined;
    if (targetUrl !== undefined && !isValidHttpUrl(targetUrl)) {
      const warning = `Stripped invalid targetUrl "${targetUrl}" (not a valid http/https URL) — field omitted`;
      console.warn(`[url-warning] ${location ? `${location.file}:${location.line} ` : ""}${warning}`);
      if (urlWarnings && location) {
        urlWarnings.push({ file: location.file, line: location.line, originalValue: targetUrl, action: "stripped" });
      }
      targetUrl = undefined;
    }
    return {
      ok: true,
      value: {
        command: "link-external",
        from,
        targetName,
        targetDomain: asOptionalString(raw, "targetDomain") ?? undefined,
        targetUrl,
        linkType: normalizeLinkType(asOptionalString(raw, "linkType")),
      },
    };
  }

  return { ok: false, error: `unsupported command: ${command}` };
}

function toCliArgs(cmd: StagedCommand, graphPath?: string): string[] {
  const args = ["riviere", "builder"];

  if (cmd.command === "link") {
    args.push(
      "link",
      "--from",
      cmd.from,
      "--to-domain",
      cmd.toDomain,
      "--to-module",
      cmd.toModule,
      "--to-type",
      cmd.toType,
      "--to-name",
      cmd.toName,
      "--link-type",
      cmd.linkType ?? "sync"
    );
  } else if (cmd.command === "link-http") {
    args.push(
      "link-http",
      "--path",
      cmd.path,
      "--to-domain",
      cmd.toDomain,
      "--to-module",
      cmd.toModule,
      "--to-type",
      cmd.toType,
      "--to-name",
      cmd.toName,
      "--link-type",
      cmd.linkType ?? "sync"
    );
    if (cmd.method) args.push("--method", cmd.method);
  } else {
    args.push(
      "link-external",
      "--from",
      cmd.from,
      "--target-name",
      cmd.targetName,
      "--link-type",
      cmd.linkType ?? "sync"
    );
    if (cmd.targetDomain) args.push("--target-domain", cmd.targetDomain);
    if (cmd.targetUrl) args.push("--target-url", cmd.targetUrl);
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
    .filter((f) => /^link-staged-.*\.jsonl$/.test(f))
    .sort();

  if (stagedFiles.length === 0) {
    console.log(`No staged link files found in ${workDir} (pattern: link-staged-*.jsonl)`);
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
    urlWarnings: [],
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

      const parsed = parseStagedCommand(raw, { file: fullPath, line: lineNo }, report.urlWarnings);
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
        const stderr = res.stderr ?? "";
        // Detect graph schema validation cascade: one bad write poisons all future reads.
        // Abort immediately to avoid hundreds of identical failures.
        if (stderr.includes("RiviereSchemaValidationError")) {
          const instancePathMatch = stderr.match(/instancePath[":\s]+"?([^"\\n,]+)/);
          const instancePath = instancePathMatch ? instancePathMatch[1] : "(see stderr below)";
          const cascadeMsg =
            `\n[CASCADE ABORT] RiviereSchemaValidationError detected at graph path: ${instancePath}\n` +
            `This is a graph poisoning cascade — a previously staged command wrote an invalid value\n` +
            `to graph.json. Remaining commands are skipped because every riviere CLI call will fail\n` +
            `until the bad entry is repaired.\n` +
            `\nTo repair: open graph.json and fix or remove the entry at: ${instancePath}\n` +
            `Then re-run: bun tools/replay-staged-links.ts --project-root "$PROJECT_ROOT"\n`;
          console.error(cascadeMsg);
          report.failures.push({
            file: fullPath,
            line: lineNo,
            reason: `CASCADE ABORT — RiviereSchemaValidationError at ${instancePath}`,
            command: raw,
            stdout: res.stdout ?? "",
            stderr,
          });
          // Write partial report before exiting so caller has context.
          mkdirSync(workDir, { recursive: true });
          writeFileSync(join(workDir, "link-replay-report.json"), JSON.stringify(report, null, 2));
          process.exit(2);
        }
        report.failures.push({
          file: fullPath,
          line: lineNo,
          reason: `CLI failed (exit ${(res.status ?? -1).toString()})`,
          command: raw,
          stdout: res.stdout ?? "",
          stderr,
        });
      }
    }
  }

  mkdirSync(workDir, { recursive: true });
  const reportPath = join(workDir, "link-replay-report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(
    `Processed ${report.filesProcessed.length} file(s), ${report.linesTotal} staged line(s), ` +
      `${report.commandsSucceeded}/${report.commandsAttempted} command(s) succeeded.`
  );
  if (report.urlWarnings.length > 0) {
    console.warn(
      `URL warnings: ${report.urlWarnings.length} invalid targetUrl value(s) were stripped ` +
        `(not valid http/https). Check urlWarnings in the report for details.`
    );
  }
  console.log(`Report: ${reportPath}`);

  if (report.failures.length > 0) {
    console.error(`Failures: ${report.failures.length}`);
    process.exit(2);
  }
}

main();
