#!/usr/bin/env bun
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, resolve } from "path";

function parseArgs(argv: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      result[argv[i].slice(2)] = argv[i + 1] ?? "true";
      i++;
    }
  }
  return result;
}

const args = parseArgs(Bun.argv.slice(2));
const sessionId = args.session ?? crypto.randomUUID().slice(0, 8);
// Single-repo mode: session data lives in {repo}/.archimedes/ so analysis
// artifacts are co-located with the codebase being analyzed, not the plugin.
const repoArg = args.repo;
const root = args.root ?? (repoArg ? join(repoArg, ".archimedes") : ".archimedes");
const repos = (args.repos ?? repoArg ?? "").split(",").map(r => r.trim()).filter(Boolean);
const packs = (args.packs ?? "core").split(",").map(p => p.trim()).filter(Boolean);
const timeLimit = parseInt(args["time-limit"] ?? "60", 10);

// Validate repos exist
for (const repo of repos) {
  if (!existsSync(repo)) {
    console.error(JSON.stringify({ error: `Repo not found: ${repo}` }));
    process.exit(1);
  }
}

const sessionDir = join(root, "sessions", sessionId);
mkdirSync(sessionDir, { recursive: true });

// Resolve dbPath to an absolute path so that the tag-store subprocess can find it
// regardless of what cwd it is invoked with.
const dbPath = resolve(join(sessionDir, "tags.db"));
const pluginRoot = new URL("../", import.meta.url).pathname;

// Initialize the tag store
const initResult = Bun.spawnSync(
  ["bun", "tools/tag-store.ts", "init", "--session", sessionId, "--db", dbPath],
  { cwd: pluginRoot }
);

if (initResult.exitCode !== 0) {
  console.error(JSON.stringify({ error: "Failed to initialize tag store" }));
  process.exit(1);
}

const meta = {
  session_id: sessionId,
  repos,
  pattern_packs: packs,
  exclude_packs: [] as string[],
  time_limit_minutes: timeLimit,
  started_at: new Date().toISOString(),
  db_path: dbPath,
};

writeFileSync(join(sessionDir, "meta.json"), JSON.stringify(meta, null, 2));

console.log(JSON.stringify({
  ok: true,
  session_id: sessionId,
  db_path: dbPath,
  meta_path: join(sessionDir, "meta.json"),
}));
