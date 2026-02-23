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
