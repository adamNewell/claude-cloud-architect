#!/usr/bin/env bun
/**
 * agent-report.ts
 *
 * Generates completion reports for subagents by reading their JSONL output
 * and computing statistics. Agents call this instead of manually counting
 * lines and formatting report strings — saves context tokens.
 *
 * Usage:
 *   bun tools/agent-report.ts --project-root "$PROJECT_ROOT" --step explore --repo orders-service
 *   bun tools/agent-report.ts --project-root "$PROJECT_ROOT" --step configure --repo orders-service --type API
 *   bun tools/agent-report.ts --project-root "$PROJECT_ROOT" --step validate --type Event
 *
 * Exit codes:
 *   0 — report generated
 *   1 — invalid arguments
 *   2 — output file not found (agent may not have written it yet)
 */

import { existsSync, readFileSync } from "fs";
import { resolve, basename } from "path";
import { parseArgs } from "util";

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    "project-root": { type: "string" },
    step: { type: "string" },
    repo: { type: "string" },
    type: { type: "string" },
  },
});

const projectRoot = values["project-root"];
const step = values.step;
const repo = values.repo;
const type = values.type;

if (!projectRoot || !step) {
  console.error(
    "Usage: bun tools/agent-report.ts --project-root <path> --step <step> [--repo <name>] [--type <name>]"
  );
  console.error("Steps: explore, configure, extract, connect, annotate, trace, validate");
  process.exit(1);
}

const workDir = resolve(projectRoot, ".riviere/work");

function readJsonlLines(filePath: string): Record<string, unknown>[] {
  if (!existsSync(filePath)) {
    console.error(`Output file not found: ${filePath}`);
    process.exit(2);
  }
  const content = readFileSync(filePath, "utf8").trim();
  if (!content) return [];
  return content
    .split("\n")
    .map((line, i) => {
      try {
        return JSON.parse(line) as Record<string, unknown>;
      } catch {
        console.error(`Warning: invalid JSON on line ${i + 1} of ${basename(filePath)}`);
        return null;
      }
    })
    .filter((x): x is Record<string, unknown> => x !== null);
}

function requireRepo(): string {
  if (!repo) {
    console.error(`--repo required for step '${step}'`);
    process.exit(1);
  }
  return repo;
}

function requireType(): string {
  if (!type) {
    console.error(`--type required for step '${step}'`);
    process.exit(1);
  }
  return type;
}

switch (step) {
  case "explore": {
    const r = requireRepo();
    const metaFile = resolve(workDir, `meta-${r}.jsonl`);
    const domainsFile = resolve(workDir, `domains-${r}.jsonl`);
    const metaLines = readJsonlLines(metaFile);
    // domains file may not exist if no new domains found
    const domainLines = existsSync(domainsFile) ? readJsonlLines(domainsFile) : [];
    const newDomains = domainLines.filter((l) => l.action === "new").length;
    console.log(
      `EXPLORE_DONE: ${r} | ${newDomains} domains found | ${metaLines.length} facets written`
    );
    break;
  }

  case "configure": {
    const r = requireRepo();
    const t = requireType();
    const rulesFile = resolve(workDir, `rules-${r}-${t}.jsonl`);
    const lines = readJsonlLines(rulesFile);
    console.log(
      `CONFIGURE_DONE: ${r}/${t} | ${lines.length} rules defined | File: .riviere/work/rules-${r}-${t}.jsonl`
    );
    break;
  }

  case "extract": {
    const r = requireRepo();
    const extractFile = resolve(workDir, `extract-${r}.jsonl`);
    const lines = readJsonlLines(extractFile);
    console.log(
      `EXTRACT_DONE: ${r} | ${lines.length} components staged | File: .riviere/work/extract-${r}.jsonl`
    );
    break;
  }

  case "connect": {
    const r = requireRepo();
    const linkFile = resolve(workDir, `link-staged-${r}.jsonl`);
    const lines = readJsonlLines(linkFile);
    console.log(
      `CONNECT_DONE: ${r} | ${lines.length} links staged | File: .riviere/work/link-staged-${r}.jsonl`
    );
    break;
  }

  case "annotate": {
    const r = requireRepo();
    const enrichFile = resolve(workDir, `annotate-staged-${r}.jsonl`);
    const lines = readJsonlLines(enrichFile);
    console.log(
      `ANNOTATE_DONE: ${r} | ${lines.length} enrichments staged | File: .riviere/work/annotate-staged-${r}.jsonl`
    );
    break;
  }

  case "trace": {
    const r = requireRepo();
    const traceFile = resolve(workDir, `trace-${r}.jsonl`);
    const lines = readJsonlLines(traceFile);
    const undocumented = lines.filter((l) => l.gap === "undocumented").length;
    console.log(
      `TRACE_DONE: ${r} | ${lines.length} trace entries | ${undocumented} undocumented | File: .riviere/work/trace-${r}.jsonl`
    );
    break;
  }

  case "validate": {
    const t = requireType();
    const orphanFile = resolve(workDir, `orphan-analysis-${t}.jsonl`);
    const lines = readJsonlLines(orphanFile);
    const linkActions = lines.filter((l) => l.action === "link").length;
    const accepted = lines.filter((l) => l.action === "accept").length;
    console.log(
      `VALIDATE_DONE: ${t} | ${lines.length} orphans analyzed | ${linkActions} link actions | ${accepted} accepted | File: .riviere/work/orphan-analysis-${t}.jsonl`
    );
    break;
  }

  default:
    console.error(
      `Unknown step: ${step}. Must be one of: explore, configure, extract, connect, annotate, trace, validate`
    );
    process.exit(1);
}
