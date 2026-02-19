#!/usr/bin/env bun
/**
 * generate-link-candidates.ts
 *
 * Reads Extract JSONL staging files and generates high-confidence link candidates
 * using two strategies:
 *
 *   1. subscribedEvents (pure JSONL — zero source reading)
 *      EventHandler.subscribedEvents → find matching Event by name → async link
 *
 *   2. Named import grep (source analysis)
 *      For each component type, search caller source files for the component's
 *      name in various casings (PascalCase, camelCase, snake_case, kebab-case).
 *      Only outputs a candidate when a match is found on a non-comment line.
 *
 * Output: .riviere/work/link-candidates.jsonl
 *
 * NEVER calls the riviere CLI. Pure analysis + file writing.
 *
 * Usage:
 *   bun generate-link-candidates.ts <repo-path...>
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

// ─── Help ─────────────────────────────────────────────────────────────────────

const HELP = `
generate-link-candidates — generate high-confidence link candidates from staged JSONL

Two strategies:
  1. subscribedEvents  EventHandler.subscribedEvents → matching Event → async link
  2. Named import grep  Search caller source files for component name variants

USAGE
  bun generate-link-candidates.ts <repo-path...>
  bun generate-link-candidates.ts --help

ARGUMENTS
  repo-path    One or more repository root paths used to resolve filePath fields

OUTPUT
  .riviere/work/link-candidates.jsonl

OPTIONS
  --help, -h   Show this help
`.trim();

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Component {
  type: string;
  domain: string;
  module: string;
  name: string;
  repository: string;
  filePath: string;
  lineNumber: number;
  subscribedEvents?: string[];
  eventName?: string;
  [key: string]: unknown;
}

interface Evidence {
  source: "subscribedEvents" | "import";
  file?: string;
  line?: number;
  matched: string;
}

interface LinkCandidate {
  from: string;
  to: string;
  linkType: "sync" | "async";
  confidence: "HIGH";
  evidence: Evidence;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build the riviere component ID from its fields */
function componentId(c: Component): string {
  return `${c.domain}:${c.module}:${c.type.toLowerCase()}:${c.name}`;
}

/**
 * Generate name variants for grep.
 * "place-order" → ["place-order", "PlaceOrder", "placeOrder", "place_order"]
 */
function nameVariants(name: string): string[] {
  const words = name.split(/[-_]/);
  const pascal = words.map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  const camel =
    words[0] + words.slice(1).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  const snake = words.join("_");
  const all = [name, pascal, camel, snake];
  return [...new Set(all)]; // deduplicate
}

/**
 * Normalize an event name to kebab-case for matching against component names.
 * "OrderPlaced" → "order-placed"
 */
function toKebab(name: string): string {
  return name
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
}

/** Find a relative filePath under one of the provided repo root paths */
function resolveFile(filePath: string, repoPaths: string[]): string | null {
  for (const root of repoPaths) {
    const full = path.join(root, filePath);
    if (existsSync(full)) return full;
  }
  return null;
}

/** Return true if a source line is a comment (JS/TS/Python/Go common prefixes) */
function isComment(line: string): boolean {
  const t = line.trim();
  return (
    t.startsWith("//") ||
    t.startsWith("*") ||
    t.startsWith("/*") ||
    t.startsWith("#") ||
    t.startsWith("--")
  );
}

// ─── Type hierarchy ───────────────────────────────────────────────────────────

/**
 * Caller types for each target type.
 * EventHandlers are resolved purely via subscribedEvents — not via source grep.
 */
const CALLERS: Record<string, string[]> = {
  UseCase: ["API"],
  DomainOp: ["UseCase"],
  Event: ["UseCase", "DomainOp"],
};

const LINK_TYPE: Record<string, "sync" | "async"> = {
  UseCase: "sync",
  DomainOp: "sync",
  Event: "async",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const repoPaths = process.argv.slice(2);

  if (repoPaths.length === 0) {
    console.error(
      "Usage: bun generate-link-candidates.ts <repo-path...>\n" +
        "  Reads .riviere/work/extract-*.jsonl from the current directory.\n" +
        "  repo-paths are used to resolve filePath fields to absolute paths."
    );
    process.exit(1);
  }

  // ── 1. Load all Extract JSONL ──────────────────────────────────────────────

  const workDir = ".riviere/work";
  if (!existsSync(workDir)) {
    console.error(`No .riviere/work directory found. Run Extract first.`);
    process.exit(1);
  }

  const extractFiles = readdirSync(workDir)
    .filter((f) => f.startsWith("extract-") && f.endsWith(".jsonl"))
    .map((f) => path.join(workDir, f));

  if (extractFiles.length === 0) {
    console.log("No extract-*.jsonl files found in .riviere/work — nothing to do.");
    process.exit(0);
  }

  const allComponents: Component[] = [];
  for (const file of extractFiles) {
    const lines = readFileSync(file, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    for (const line of lines) {
      try {
        allComponents.push(JSON.parse(line) as Component);
      } catch {
        // Skip malformed lines
      }
    }
  }

  console.log(
    `Loaded ${allComponents.length} components from ${extractFiles.length} file(s).`
  );

  // ── 2. Build lookup maps ───────────────────────────────────────────────────

  const byType = new Map<string, Component[]>();
  // Event name index: normalized kebab-case and raw name → Component
  const eventByName = new Map<string, Component>();

  for (const c of allComponents) {
    if (!byType.has(c.type)) byType.set(c.type, []);
    byType.get(c.type)!.push(c);

    if (c.type === "Event") {
      const raw = c.eventName ?? c.name;
      eventByName.set(raw, c);
      eventByName.set(toKebab(raw), c);
      // Also index by PascalCase in case the event name uses it
      const pascal = raw
        .split("-")
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join("");
      eventByName.set(pascal, c);
    }
  }

  // ── 3. Strategy A: subscribedEvents → Event (pure JSONL) ──────────────────

  const candidates: LinkCandidate[] = [];
  let fromSubscribed = 0;

  const handlers = byType.get("EventHandler") ?? [];
  for (const handler of handlers) {
    for (const eventName of handler.subscribedEvents ?? []) {
      const event =
        eventByName.get(eventName) ??
        eventByName.get(toKebab(eventName));
      if (event) {
        candidates.push({
          from: componentId(handler),
          to: componentId(event),
          linkType: "async",
          confidence: "HIGH",
          evidence: { source: "subscribedEvents", matched: eventName },
        });
        fromSubscribed++;
      }
    }
  }

  // ── 4. Strategy B: named import grep across caller source files ────────────

  let fromGrep = 0;

  for (const [targetType, callerTypes] of Object.entries(CALLERS)) {
    const targets = byType.get(targetType) ?? [];
    const callers = callerTypes.flatMap((t) => byType.get(t) ?? []);

    if (targets.length === 0 || callers.length === 0) continue;

    for (const target of targets) {
      const variants = nameVariants(target.name);
      const targetId = componentId(target);

      for (const caller of callers) {
        const callerId = componentId(caller);
        if (callerId === targetId) continue; // skip self-reference

        const callerFile = resolveFile(caller.filePath, repoPaths);
        if (!callerFile) continue;

        let sourceLines: string[];
        try {
          sourceLines = readFileSync(callerFile, "utf8").split("\n");
        } catch {
          continue;
        }

        for (let i = 0; i < sourceLines.length; i++) {
          const line = sourceLines[i];
          if (isComment(line)) continue;

          const matched = variants.find((v) => line.includes(v));
          if (matched) {
            candidates.push({
              from: callerId,
              to: targetId,
              linkType: LINK_TYPE[targetType] ?? "sync",
              confidence: "HIGH",
              evidence: {
                source: "import",
                file: callerFile,
                line: i + 1,
                matched: line.trim().slice(0, 120),
              },
            });
            fromGrep++;
            break; // one match per caller file is sufficient
          }
        }
      }
    }
  }

  // ── 5. Deduplicate on from+to ──────────────────────────────────────────────

  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    const key = `${c.from}→${c.to}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // ── 6. Write output ────────────────────────────────────────────────────────

  const outPath = path.join(workDir, "link-candidates.jsonl");
  const output = unique.map((c) => JSON.stringify(c)).join("\n");
  writeFileSync(outPath, output + (output ? "\n" : ""));

  console.log(`\nLink candidates generated: ${unique.length} total`);
  console.log(`  From subscribedEvents : ${fromSubscribed}`);
  console.log(`  From source grep      : ${fromGrep}`);
  console.log(`  Deduplicated          : ${candidates.length - unique.length}`);
  console.log(`  → ${outPath}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
