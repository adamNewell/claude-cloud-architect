import { test, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

let tmpDir: string;
let dbPath: string;
const sessionId = "test-session-001";

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "archimedes-test-"));
  dbPath = join(tmpDir, "tags.db");
});

afterEach(() => { rmSync(tmpDir, { recursive: true }); });

function runTagStore(args: string[]) {
  return Bun.spawnSync(["bun", "tools/tag-store.ts", ...args], {
    cwd: new URL("../", import.meta.url).pathname,
  });
}

test("init: creates tags table with correct schema", () => {
  const result = runTagStore(["init", "--session", sessionId, "--db", dbPath]);
  expect(result.exitCode).toBe(0);

  const db = new Database(dbPath);
  const cols = db.query("PRAGMA table_info(tags)").all() as any[];
  const colNames = cols.map(c => c.name);
  expect(colNames).toContain("id");
  expect(colNames).toContain("kind");
  expect(colNames).toContain("confidence");
  expect(colNames).toContain("weight_class");
  expect(colNames).toContain("status");
  expect(colNames).toContain("session_id");
  expect(colNames).toContain("value");
  db.close();
});

test("init: enables WAL mode", () => {
  runTagStore(["init", "--session", sessionId, "--db", dbPath]);
  const db = new Database(dbPath);
  const result = db.query("PRAGMA journal_mode").get() as any;
  expect(result.journal_mode).toBe("wal");
  db.close();
});

test("init: idempotent — running twice does not error", () => {
  runTagStore(["init", "--session", sessionId, "--db", dbPath]);
  const result = runTagStore(["init", "--session", sessionId, "--db", dbPath]);
  expect(result.exitCode).toBe(0);
});

test("init: fails with error JSON when neither --session nor --db provided", () => {
  const result = runTagStore(["init"]);
  expect(result.exitCode).toBe(1);
  const err = JSON.parse(result.stderr.toString());
  expect(err.error).toBeDefined();
});

test("init: returns valid JSON with ok and session fields", () => {
  const result = runTagStore(["init", "--session", sessionId, "--db", dbPath]);
  expect(result.exitCode).toBe(0);
  const output = JSON.parse(result.stdout.toString());
  expect(output.ok).toBe(true);
  expect(output.session).toBe(sessionId);
});

function initDb(db: string, session: string) {
  runTagStore(["init", "--session", session, "--db", db]);
}

function writeTag(db: string, session: string, overrides: string[] = []) {
  return runTagStore([
    "write",
    "--session", session, "--db", db,
    "--kind", "PATTERN",
    "--target-ref", "/src/handler.ts",
    "--target-repo", "/repos/my-service",
    "--value", '{"pattern_name":"lambda-handler"}',
    "--confidence", "0.95",
    "--weight", "HUMAN",
    "--source-tool", "ast-grep",
    "--source-query", "lambda-handler",
    ...overrides,
  ]);
}

test("write: creates a tag and returns its id", () => {
  initDb(dbPath, sessionId);
  const result = writeTag(dbPath, sessionId);
  expect(result.exitCode).toBe(0);
  const output = JSON.parse(result.stdout.toString());
  expect(output.id).toBeDefined();
  expect(output.ok).toBe(true);
});

test("write: deduplication — same target_ref+kind+source_tool returns same id", () => {
  initDb(dbPath, sessionId);
  const first = JSON.parse(writeTag(dbPath, sessionId).stdout.toString());
  const second = JSON.parse(writeTag(dbPath, sessionId).stdout.toString());
  expect(first.id).toBe(second.id);
});

test("write: different target_ref creates separate tags", () => {
  initDb(dbPath, sessionId);
  const a = JSON.parse(writeTag(dbPath, sessionId, ["--target-ref", "/src/a.ts"]).stdout.toString());
  const b = JSON.parse(writeTag(dbPath, sessionId, ["--target-ref", "/src/b.ts"]).stdout.toString());
  expect(a.id).not.toBe(b.id);
});

test("write: HUMAN weight tags get VALIDATED status immediately", () => {
  initDb(dbPath, sessionId);
  writeTag(dbPath, sessionId, ["--weight", "HUMAN"]);
  const db = new Database(dbPath);
  const tag = db.query("SELECT status FROM tags WHERE weight_class = 'HUMAN'").get() as any;
  expect(tag.status).toBe("VALIDATED");
  db.close();
});

test("write: MACHINE weight tags get CANDIDATE status", () => {
  initDb(dbPath, sessionId);
  writeTag(dbPath, sessionId, ["--weight", "MACHINE"]);
  const db = new Database(dbPath);
  const tag = db.query("SELECT status FROM tags WHERE weight_class = 'MACHINE'").get() as any;
  expect(tag.status).toBe("CANDIDATE");
  db.close();
});

test("query: returns matching rows as JSON array", () => {
  initDb(dbPath, sessionId);
  writeTag(dbPath, sessionId, ["--kind", "PATTERN", "--target-ref", "/src/a.ts"]);
  writeTag(dbPath, sessionId, ["--kind", "DEPENDENCY", "--target-ref", "/src/b.ts",
    "--source-query", "dep-query"]);

  const result = runTagStore([
    "query", "--session", sessionId, "--db", dbPath,
    "--sql", "SELECT kind, target_ref FROM tags WHERE kind = 'PATTERN'",
  ]);
  expect(result.exitCode).toBe(0);
  const rows = JSON.parse(result.stdout.toString());
  expect(rows).toHaveLength(1);
  expect(rows[0].kind).toBe("PATTERN");
});

test("query: empty result returns [] not error", () => {
  initDb(dbPath, sessionId);
  const result = runTagStore([
    "query", "--session", sessionId, "--db", dbPath,
    "--sql", "SELECT * FROM tags WHERE kind = 'NONEXISTENT'",
  ]);
  expect(result.exitCode).toBe(0);
  expect(JSON.parse(result.stdout.toString())).toEqual([]);
});

test("query: invalid SQL exits 1 with error JSON on stderr", () => {
  initDb(dbPath, sessionId);
  const result = runTagStore([
    "query", "--session", sessionId, "--db", dbPath,
    "--sql", "SELECT * FROM no_such_table",
  ]);
  expect(result.exitCode).toBe(1);
  const err = JSON.parse(result.stderr.toString());
  expect(err.error).toBeDefined();
});

test("promote: changes CANDIDATE to PROMOTED weight and status", () => {
  initDb(dbPath, sessionId);
  const written = JSON.parse(writeTag(dbPath, sessionId, ["--weight", "MACHINE"]).stdout.toString());

  runTagStore(["promote", "--session", sessionId, "--db", dbPath, "--tag-id", written.id]);

  const db = new Database(dbPath);
  const tag = db.query("SELECT status, weight_class FROM tags WHERE id = ?").get(written.id) as any;
  expect(tag.status).toBe("PROMOTED");
  expect(tag.weight_class).toBe("PROMOTED");
  db.close();
});

test("reject: changes status to REJECTED", () => {
  initDb(dbPath, sessionId);
  const written = JSON.parse(writeTag(dbPath, sessionId, ["--weight", "MACHINE"]).stdout.toString());

  runTagStore(["reject", "--session", sessionId, "--db", dbPath, "--tag-id", written.id]);

  const db = new Database(dbPath);
  const tag = db.query("SELECT status FROM tags WHERE id = ?").get(written.id) as any;
  expect(tag.status).toBe("REJECTED");
  db.close();
});

test("export: json format returns all non-rejected tags", () => {
  initDb(dbPath, sessionId);
  writeTag(dbPath, sessionId);
  const result = runTagStore([
    "export", "--session", sessionId, "--db", dbPath, "--format", "json",
  ]);
  expect(result.exitCode).toBe(0);
  const tags = JSON.parse(result.stdout.toString());
  expect(Array.isArray(tags)).toBe(true);
  expect(tags[0]).toHaveProperty("id");
  expect(tags[0]).toHaveProperty("kind");
});
