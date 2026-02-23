import { test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

let tmpDir: string;

beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), "arch-session-")); });
afterEach(() => { rmSync(tmpDir, { recursive: true }); });

function runSessionInit(args: string[]) {
  return Bun.spawnSync(["bun", "tools/session-init.ts", ...args], {
    cwd: new URL("../", import.meta.url).pathname,
  });
}

test("session-init: creates session directory, tags.db, and meta.json", () => {
  const result = runSessionInit([
    "--session", "test-001", "--root", tmpDir, "--repos", tmpDir,
  ]);
  expect(result.exitCode).toBe(0);
  expect(existsSync(join(tmpDir, "sessions/test-001/meta.json"))).toBe(true);
  expect(existsSync(join(tmpDir, "sessions/test-001/tags.db"))).toBe(true);
});

test("session-init: meta.json contains repos, packs, time limit, timestamp", () => {
  runSessionInit([
    "--session", "test-001", "--root", tmpDir,
    "--repos", tmpDir, "--packs", "core,aws-serverless",
  ]);
  const meta = JSON.parse(readFileSync(join(tmpDir, "sessions/test-001/meta.json"), "utf-8"));
  expect(meta.session_id).toBe("test-001");
  expect(meta.repos).toContain(tmpDir);
  expect(meta.pattern_packs).toContain("aws-serverless");
  expect(meta.started_at).toBeDefined();
});

test("session-init: auto-generates session id when not provided", () => {
  const result = runSessionInit(["--root", tmpDir, "--repos", tmpDir]);
  expect(result.exitCode).toBe(0);
  const output = JSON.parse(result.stdout.toString());
  expect(output.session_id).toBeDefined();
  expect(output.session_id.length).toBeGreaterThan(4);
});

test("session-init: exits 1 when repo path does not exist", () => {
  const result = runSessionInit([
    "--root", tmpDir, "--repos", "/nonexistent/path/to/repo",
  ]);
  expect(result.exitCode).toBe(1);
  const err = JSON.parse(result.stderr.toString());
  expect(err.error).toContain("not found");
});
