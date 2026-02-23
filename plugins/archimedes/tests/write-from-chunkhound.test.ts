import { test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";

const tmpDir = mkdtempSync("/tmp/arch-test-");
const dbPath = join(tmpDir, "tags.db");
const sessionId = "test-chunkhound-001";
const ruleFile = join(tmpDir, "test-rule.yaml");
const repoPath = "/test/repo";

// Sample chunkhound-search.py JSON output (uses file_path and similarity, NOT file/score)
const chunkhoundOutput = JSON.stringify([
  {
    file_path: "/test/repo/src/db/mongo.ts",
    content: "const client = new MongoClient(uri); await client.connect();",
    similarity: 0.87
  },
  {
    file_path: "/test/repo/src/db/events-db.ts",
    content: "const db = client.db('events');",
    similarity: 0.72
  }
]);

const ruleYaml = `
archimedes:
  kind: CAPABILITY
  subkind: mongodb-client
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: mongodb-client-usage
query: "MongoDB database client connection"
top_k: 5
`;

beforeAll(async () => {
  writeFileSync(ruleFile, ruleYaml);
  // Initialize DB
  const init = Bun.spawnSync(
    ["bun", "tools/tag-store.ts", "init", "--session", sessionId, "--db", dbPath],
    { cwd: "/Users/adamnewell/code/personal/github/adamNewell/claude-cloud-architect/plugins/archimedes" }
  );
  expect(init.exitCode).toBe(0);
});

afterAll(() => rmSync(tmpDir, { recursive: true }));

test("write-from-chunkhound writes CANDIDATE tags", async () => {
  const proc = Bun.spawnSync(
    ["bun", "tools/tag-store.ts", "write-from-chunkhound",
     "--session", sessionId, "--db", dbPath,
     "--rule", ruleFile,
     "--target-repo", repoPath],
    {
      cwd: "/Users/adamnewell/code/personal/github/adamNewell/claude-cloud-architect/plugins/archimedes",
      stdin: new TextEncoder().encode(chunkhoundOutput)
    }
  );
  const result = JSON.parse(new TextDecoder().decode(proc.stdout));
  expect(result.ok).toBe(true);
  expect(result.written).toBe(2);
});

test("write-from-chunkhound deduplicates on re-run", async () => {
  const proc = Bun.spawnSync(
    ["bun", "tools/tag-store.ts", "write-from-chunkhound",
     "--session", sessionId, "--db", dbPath,
     "--rule", ruleFile,
     "--target-repo", repoPath],
    {
      cwd: "/Users/adamnewell/code/personal/github/adamNewell/claude-cloud-architect/plugins/archimedes",
      stdin: new TextEncoder().encode(chunkhoundOutput)
    }
  );
  const result = JSON.parse(new TextDecoder().decode(proc.stdout));
  expect(result.ok).toBe(true);
  // Total count in DB stays 2 (dedup)
  const query = Bun.spawnSync(
    ["bun", "tools/tag-store.ts", "query",
     "--session", sessionId, "--db", dbPath,
     "--sql", `SELECT COUNT(*) as c FROM tags WHERE session_id='${sessionId}'`],
    { cwd: "/Users/adamnewell/code/personal/github/adamNewell/claude-cloud-architect/plugins/archimedes" }
  );
  const qResult = JSON.parse(new TextDecoder().decode(query.stdout));
  expect(qResult[0].c).toBe(2);
});

test("written tags have MACHINE weight and CANDIDATE status", async () => {
  const query = Bun.spawnSync(
    ["bun", "tools/tag-store.ts", "query",
     "--session", sessionId, "--db", dbPath,
     "--sql", `SELECT weight_class, status FROM tags WHERE session_id='${sessionId}' LIMIT 1`],
    { cwd: "/Users/adamnewell/code/personal/github/adamNewell/claude-cloud-architect/plugins/archimedes" }
  );
  const rows = JSON.parse(new TextDecoder().decode(query.stdout));
  expect(rows[0].weight_class).toBe("MACHINE");
  expect(rows[0].status).toBe("CANDIDATE");
});
