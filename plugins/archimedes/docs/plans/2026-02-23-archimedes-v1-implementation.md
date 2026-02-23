# Archimedes v1 Implementation Plan

> **For Claude:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Archimedes v1 — a Claude Code plugin for AI-assisted architecture intelligence with deterministic pattern matching, semantic retrieval, and agentic search unified by a persistent SQLite tag store.

**Architecture:** Three-tier intelligence (Tier 1: ast-grep deterministic scripts, Tier 2: ColGREP/qmd semantic, Tier 3: osgrep/Serena agentic) connected by SQLite. KEY PRINCIPLE: pattern execution is script-driven — `scan.sh` runs ast-grep and writes directly to tag store with no LLM in the write path. Agents read tag store after the fact to synthesize findings, eliminating hallucination from fact-gathering.

**Tech Stack:** Bun + TypeScript (tools), bash (scan scripts), SQLite via `bun:sqlite` (tag store), ast-grep (pattern matching), code-chunk + ColGREP (Phase 2), qmd + rlmgrep (Phase 2), osgrep + Serena LSP (Phase 3), Rivière CLI (Phase 3), js-yaml (YAML parsing in tools)

---

## Phase Overview

| Phase         | Weeks | Goal                                          | Gate                                                                   |
| ------------- | ----- | --------------------------------------------- | ---------------------------------------------------------------------- |
| 1: Foundation | 1–4   | Tag store + deterministic patterns working    | `arch-assess` on one real Delos repo produces accurate service profile |
| 2: Semantic   | 5–8   | Semantic layer adds findings ast-grep missed  | Semantic tags complement deterministic tags on same repo               |
| 3: Agentic    | 9–12  | Role classification + flow synthesis          | `arch-trace-flow` produces valid Rivière schema                        |
| 4: Autonomy   | 13–16 | Full `arch-modernize` produces 5 deliverables | End-to-end on Delos codebase in <30 min                                |

**This plan covers Phase 1 in full detail. Phases 2–4 are scoped; plan each phase when the previous gate passes.**

---

## File Structure

```
plugins/archimedes/
├── tools/
│   ├── tag-store.ts              ← SQLite CRUD + query CLI (Phase 1, CRITICAL PATH)
│   ├── session-init.ts           ← Session creation + repo registration (Phase 1)
│   ├── report-generate.ts        ← 5 client deliverables (Phase 4)
│   └── scripts/
│       └── run-structure-scan.sh ← Deterministic scan orchestrator (Phase 1)
├── patterns/
│   ├── _registry.yaml            ← Pack registry
│   ├── core/
│   │   ├── pack.yaml             ← Pack metadata + defaults
│   │   ├── scan.sh               ← Runs all core rules → tag store
│   │   └── rules/                ← 10 ast-grep YAML rule files
│   ├── aws-serverless/
│   │   ├── pack.yaml
│   │   ├── scan.sh
│   │   └── rules/                ← 20 ast-grep YAML rule files
│   └── iot-core/
│       ├── pack.yaml
│       ├── scan.sh
│       └── rules/                ← 13 ast-grep YAML rule files (incl. GGv2)
├── skills/
│   ├── arch-tags/SKILL.md        ← Tag store meta-skill (Phase 1)
│   ├── arch-structure/SKILL.md   ← ast-grep wrapper skill (Phase 1)
│   ├── arch-search/SKILL.md      ← code-chunk + ColGREP (Phase 2)
│   ├── arch-docs/SKILL.md        ← qmd + rlmgrep (Phase 2)
│   ├── arch-observe/SKILL.md     ← osgrep role classification (Phase 3)
│   ├── arch-navigate/SKILL.md    ← Serena LSP navigation (Phase 3)
│   ├── arch-flows/SKILL.md       ← Rivière flow synthesis (Phase 3)
│   ├── arch-map-service/SKILL.md ← workflow: structure→search→observe (Phase 2)
│   ├── arch-trace-flow/SKILL.md  ← workflow: navigate→search→docs→flows (Phase 3)
│   ├── arch-assess-debt/SKILL.md ← workflow: structure→observe→docs (Phase 3)
│   ├── arch-map-infra/SKILL.md   ← IaC topology extraction (Phase 4)
│   ├── arch-modernize/
│   │   ├── SKILL.md              ← Autonomous orchestration (Phase 4)
│   │   └── steps/                ← 6 step files (Phase 4)
│   └── arch-investigate/SKILL.md ← Open-ended investigation (Phase 4)
├── agents/
│   ├── structure-agent.md        ← Phase 1
│   ├── search-agent.md           ← Phase 2
│   ├── docs-agent.md             ← Phase 2
│   ├── observe-agent.md          ← Phase 3
│   ├── navigate-agent.md         ← Phase 3
│   └── flow-agent.md             ← Phase 3
├── cookbook/
│   ├── ast-grep/cli.md + patterns.md    ← Phase 1
│   ├── tag-store/schema.md + queries.md ← Phase 1 (20+ SQL templates)
│   ├── colgrep/cli.md                   ← Phase 2
│   ├── qmd/cli.md + rlmgrep/cli.md      ← Phase 2
│   ├── osgrep/cli.md                    ← Phase 3
│   └── serena/cli.md                    ← Phase 3
└── tests/
    ├── tag-store.test.ts
    ├── session-init.test.ts
    └── patterns/
        ├── fixtures/             ← Sample code files for pattern verification
        └── verify-patterns.sh   ← Smoke test all patterns against fixtures
```

**Rule file convention:** One rule per YAML file (ast-grep constraint). Files carry an `archimedes:` top-level metadata block that `scan.sh` strips with `yq` before passing to ast-grep. The `write-from-ast-grep` command reads both ast-grep JSON output AND the original rule file to get Archimedes metadata.

---

## Chunk 1: Phase 1 — Foundation (Weeks 1–4)

### Task 1: Repository Setup + Dependencies

**Files:**
- Create: `plugins/archimedes/package.json`
- Create: `plugins/archimedes/tsconfig.json`

- [ ] **Step 1: Initialize package.json**

```json
{
  "name": "@archimedes/plugin",
  "version": "0.2.0",
  "private": true,
  "scripts": {
    "test": "bun test",
    "tag-store": "bun tools/tag-store.ts",
    "session-init": "bun tools/session-init.ts"
  },
  "dependencies": {
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/js-yaml": "^4.0.9"
  }
}
```

Run: `cd plugins/archimedes && bun install`
Expected: `bun.lockb` created, no errors.

- [ ] **Step 2: Initialize tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "types": ["bun-types"]
  }
}
```

- [ ] **Step 3: Create test directory structure**

```bash
mkdir -p plugins/archimedes/tests/patterns/fixtures
mkdir -p plugins/archimedes/tools/scripts
```

- [ ] **Step 4: Commit**

```bash
git add plugins/archimedes/package.json plugins/archimedes/tsconfig.json
git commit -m "feat(archimedes): initialize package.json and tsconfig"
```

---

### Task 2: Tag Store — Schema + Init

**Files:**
- Create: `plugins/archimedes/tools/tag-store.ts`
- Create: `plugins/archimedes/tests/tag-store.test.ts`

- [ ] **Step 1: Write failing tests for init**

Create `plugins/archimedes/tests/tag-store.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd plugins/archimedes && bun test tests/tag-store.test.ts
```

Expected: FAIL — `tools/tag-store.ts` does not exist.

- [ ] **Step 3: Implement tag-store.ts with init command**

Create `plugins/archimedes/tools/tag-store.ts`:

```typescript
#!/usr/bin/env bun
import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
import { dirname } from "path";
import yaml from "js-yaml";
import { readFileSync } from "fs";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL DEFAULT 'FILE',
  target_ref TEXT NOT NULL,
  target_repo TEXT NOT NULL,
  kind TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '{}',
  confidence REAL NOT NULL DEFAULT 0.5,
  weight_class TEXT NOT NULL DEFAULT 'MACHINE',
  source_tool TEXT NOT NULL,
  source_query TEXT,
  source_evidence TEXT,
  status TEXT NOT NULL DEFAULT 'CANDIDATE',
  parent_tag_id TEXT,
  related_tags TEXT DEFAULT '[]',
  session_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  validated_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_tags_session ON tags(session_id);
CREATE INDEX IF NOT EXISTS idx_tags_kind ON tags(kind);
CREATE INDEX IF NOT EXISTS idx_tags_status ON tags(status);
CREATE INDEX IF NOT EXISTS idx_tags_target_ref ON tags(target_ref);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_dedup
  ON tags(target_ref, kind, source_tool, session_id);
`;

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

function openDb(dbPath: string): Database {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

const [command, ...rest] = Bun.argv.slice(2);
const args = parseArgs(rest);

switch (command) {
  case "init": {
    const db = openDb(args.db ?? `.archimedes/sessions/${args.session}/tags.db`);
    db.exec(SCHEMA);
    db.close();
    console.log(JSON.stringify({ ok: true, session: args.session }));
    break;
  }

  default:
    console.error(JSON.stringify({ error: `Unknown command: ${command}` }));
    process.exit(1);
}
```

- [ ] **Step 4: Run tests to verify init passes**

```bash
cd plugins/archimedes && bun test tests/tag-store.test.ts
```

Expected: All 3 init tests PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/archimedes/tools/tag-store.ts plugins/archimedes/tests/tag-store.test.ts
git commit -m "feat(archimedes): implement tag store init with WAL mode and full schema"
```

---

### Task 3: Tag Store — Write + Deduplication

**Files:**
- Modify: `plugins/archimedes/tools/tag-store.ts`
- Modify: `plugins/archimedes/tests/tag-store.test.ts`

- [ ] **Step 1: Add write tests**

Append to `tests/tag-store.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run to verify failures**

```bash
cd plugins/archimedes && bun test tests/tag-store.test.ts -t "write"
```

Expected: FAIL — `write` command not implemented.

- [ ] **Step 3: Implement write command**

Add to `tag-store.ts` switch (before `default`):

```typescript
  case "write": {
    const dbPath = args.db ?? `.archimedes/sessions/${args.session}/tags.db`;
    const db = openDb(dbPath);
    const weight = args.weight ?? "MACHINE";
    const status = weight === "HUMAN" ? "VALIDATED" : "CANDIDATE";
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const stmt = db.prepare(`
      INSERT INTO tags
        (id, target_type, target_ref, target_repo, kind, value, confidence,
         weight_class, source_tool, source_query, source_evidence,
         status, session_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(target_ref, kind, source_tool, session_id)
      DO UPDATE SET updated_at = excluded.updated_at,
                    confidence = MAX(confidence, excluded.confidence)
      RETURNING id
    `);

    const row = stmt.get(
      id,
      args["target-type"] ?? "FILE",
      args["target-ref"],
      args["target-repo"],
      args.kind,
      args.value ?? "{}",
      parseFloat(args.confidence ?? "0.5"),
      weight,
      args["source-tool"],
      args["source-query"] ?? null,
      args["source-evidence"] ?? null,
      status,
      args.session,
      now, now
    ) as any;

    db.close();
    console.log(JSON.stringify({ ok: true, id: row.id }));
    break;
  }
```

- [ ] **Step 4: Run all tests**

```bash
cd plugins/archimedes && bun test tests/tag-store.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(archimedes): implement tag write with deduplication and weight-based status"
```

---

### Task 4: Tag Store — Query, Promote, Reject, Export

**Files:**
- Modify: `plugins/archimedes/tools/tag-store.ts`
- Modify: `plugins/archimedes/tests/tag-store.test.ts`

- [ ] **Step 1: Add tests for query, promote, reject, export**

Append to `tests/tag-store.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run to verify failures**

```bash
cd plugins/archimedes && bun test tests/tag-store.test.ts -t "query|promote|reject|export"
```

- [ ] **Step 3: Implement query, promote, reject, export**

Add to `tag-store.ts` switch:

```typescript
  case "query": {
    const db = openDb(args.db ?? `.archimedes/sessions/${args.session}/tags.db`);
    try {
      const rows = db.query(args.sql).all();
      console.log(JSON.stringify(rows));
    } catch (e: any) {
      console.error(JSON.stringify({ error: e.message }));
      process.exit(1);
    } finally { db.close(); }
    break;
  }

  case "promote": {
    const db = openDb(args.db ?? `.archimedes/sessions/${args.session}/tags.db`);
    const now = new Date().toISOString();
    db.run(
      "UPDATE tags SET status='PROMOTED', weight_class='PROMOTED', updated_at=? WHERE id=?",
      [now, args["tag-id"]]
    );
    db.close();
    console.log(JSON.stringify({ ok: true, id: args["tag-id"], status: "PROMOTED" }));
    break;
  }

  case "reject": {
    const db = openDb(args.db ?? `.archimedes/sessions/${args.session}/tags.db`);
    const now = new Date().toISOString();
    db.run("UPDATE tags SET status='REJECTED', updated_at=? WHERE id=?", [now, args["tag-id"]]);
    db.close();
    console.log(JSON.stringify({ ok: true, id: args["tag-id"], status: "REJECTED" }));
    break;
  }

  case "export": {
    const db = openDb(args.db ?? `.archimedes/sessions/${args.session}/tags.db`);
    const tags = db.query(
      "SELECT * FROM tags WHERE session_id=? AND status!='REJECTED' ORDER BY created_at"
    ).all(args.session);
    db.close();
    console.log(JSON.stringify(tags, null, 2));
    break;
  }
```

- [ ] **Step 4: Run all tests**

```bash
cd plugins/archimedes && bun test tests/tag-store.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(archimedes): add tag store query, promote, reject, export commands"
```

---

### Task 5: Tag Store — write-from-ast-grep

**Files:**
- Modify: `plugins/archimedes/tools/tag-store.ts`
- Modify: `plugins/archimedes/tests/tag-store.test.ts`

This command is the bridge between `scan.sh` and the tag store. It reads ast-grep JSON from stdin + a rule file for metadata, writes tags deterministically.

- [ ] **Step 1: Add write-from-ast-grep test**

Append to `tests/tag-store.test.ts`:

```typescript
import { writeFileSync } from "fs";

test("write-from-ast-grep: ingests ast-grep JSON output and creates tags", () => {
  initDb(dbPath, sessionId);

  const ruleFile = join(tmpDir, "lambda-handler.yaml");
  writeFileSync(ruleFile, `
id: aws-lambda-handler-cjs
language: JavaScript
archimedes:
  kind: PATTERN
  subkind: lambda-handler
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
rule:
  pattern: exports.handler = async ($EVENT, $CTX) => { $$$BODY }
`);

  const astGrepOutput = JSON.stringify([{
    text: "exports.handler = async (event, context) => {}",
    range: { start: { line: 10, column: 0, byteOffset: 234 }, end: { line: 12, column: 1, byteOffset: 280 } },
    file: "/repos/my-service/src/handler.js",
    ruleId: "aws-lambda-handler-cjs",
    language: "JavaScript",
    message: null,
  }]);

  const result = Bun.spawnSync(
    ["bun", "tools/tag-store.ts", "write-from-ast-grep",
      "--session", sessionId, "--db", dbPath,
      "--rule", ruleFile, "--source-tool", "ast-grep", "--target-repo", "/repos/my-service"],
    {
      cwd: new URL("../", import.meta.url).pathname,
      stdin: new TextEncoder().encode(astGrepOutput),
    }
  );

  expect(result.exitCode).toBe(0);
  const output = JSON.parse(result.stdout.toString());
  expect(output.written).toBe(1);

  const db = new Database(dbPath);
  const tags = db.query("SELECT * FROM tags WHERE kind='PATTERN'").all() as any[];
  expect(tags).toHaveLength(1);
  expect(tags[0].weight_class).toBe("HUMAN");
  expect(tags[0].status).toBe("VALIDATED");
  expect(tags[0].confidence).toBeCloseTo(0.95);
  db.close();
});

test("write-from-ast-grep: empty input writes 0 tags without error", () => {
  initDb(dbPath, sessionId);
  const ruleFile = join(tmpDir, "rule.yaml");
  writeFileSync(ruleFile, `
id: test-rule
language: TypeScript
archimedes:
  kind: PATTERN
  confidence: 0.9
  weight_class: HUMAN
  target_type: FILE
rule:
  pattern: "const $X = 1"
`);

  const result = Bun.spawnSync(
    ["bun", "tools/tag-store.ts", "write-from-ast-grep",
      "--session", sessionId, "--db", dbPath,
      "--rule", ruleFile, "--source-tool", "ast-grep", "--target-repo", "/repos/x"],
    {
      cwd: new URL("../", import.meta.url).pathname,
      stdin: new TextEncoder().encode("[]"),
    }
  );

  expect(result.exitCode).toBe(0);
  expect(JSON.parse(result.stdout.toString()).written).toBe(0);
});
```

- [ ] **Step 2: Run to verify failures**

```bash
cd plugins/archimedes && bun test tests/tag-store.test.ts -t "write-from-ast-grep"
```

- [ ] **Step 3: Implement write-from-ast-grep**

Add to `tag-store.ts` switch:

```typescript
  case "write-from-ast-grep": {
    const dbPath = args.db ?? `.archimedes/sessions/${args.session}/tags.db`;

    const ruleContent = yaml.load(readFileSync(args.rule, "utf-8")) as any;
    const meta = ruleContent.archimedes ?? {};
    const kind = meta.kind ?? "PATTERN";
    const confidence = meta.confidence ?? 0.7;
    const weight = meta.weight_class ?? "MACHINE";
    const targetType = meta.target_type ?? "FILE";
    const status = weight === "HUMAN" ? "VALIDATED" : "CANDIDATE";

    const input = await Bun.stdin.text();
    const matches: any[] = JSON.parse(input || "[]");

    const db = openDb(dbPath);
    const stmt = db.prepare(`
      INSERT INTO tags
        (id, target_type, target_ref, target_repo, kind, value, confidence,
         weight_class, source_tool, source_query, source_evidence,
         status, session_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(target_ref, kind, source_tool, session_id)
      DO UPDATE SET updated_at = excluded.updated_at,
                    confidence = MAX(confidence, excluded.confidence)
      RETURNING id
    `);

    const now = new Date().toISOString();
    const ids: string[] = [];

    for (const match of matches) {
      const value = JSON.stringify({
        pattern_name: ruleContent.id,
        subkind: meta.subkind,
        rule_id: match.ruleId,
        line: match.range?.start?.line,
        column: match.range?.start?.column,
        language: match.language,
      });

      const row = stmt.get(
        crypto.randomUUID(), targetType, match.file,
        args["target-repo"] ?? "", kind, value, confidence,
        weight, args["source-tool"] ?? "ast-grep",
        ruleContent.id, match.text,
        status, args.session, now, now
      ) as any;
      ids.push(row.id);
    }

    db.close();
    console.log(JSON.stringify({ ok: true, written: ids.length, ids }));
    break;
  }
```

- [ ] **Step 4: Run all tests**

```bash
cd plugins/archimedes && bun test tests/tag-store.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(archimedes): implement write-from-ast-grep — LLM-free deterministic tag ingestion"
```

---

### Task 6: Session Init

**Files:**
- Create: `plugins/archimedes/tools/session-init.ts`
- Create: `plugins/archimedes/tests/session-init.test.ts`

- [ ] **Step 1: Write failing tests**

Create `plugins/archimedes/tests/session-init.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run to verify failures**

```bash
cd plugins/archimedes && bun test tests/session-init.test.ts
```

- [ ] **Step 3: Implement session-init.ts**

Create `plugins/archimedes/tools/session-init.ts`:

```typescript
#!/usr/bin/env bun
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

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
const root = args.root ?? ".archimedes";
const repos = (args.repos ?? "").split(",").map(r => r.trim()).filter(Boolean);
const packs = (args.packs ?? "core").split(",").map(p => p.trim()).filter(Boolean);
const timeLimit = parseInt(args["time-limit"] ?? "60", 10);

for (const repo of repos) {
  if (!existsSync(repo)) {
    console.error(JSON.stringify({ error: `Repo not found: ${repo}` }));
    process.exit(1);
  }
}

const sessionDir = join(root, "sessions", sessionId);
mkdirSync(sessionDir, { recursive: true });

const dbPath = join(sessionDir, "tags.db");
const pluginRoot = new URL("../", import.meta.url).pathname;

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
```

- [ ] **Step 4: Run all tests**

```bash
cd plugins/archimedes && bun test
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(archimedes): implement session-init with repo validation and meta.json"
```

---

### Task 7: Pattern Pack Infrastructure

**Files:**
- Create: `plugins/archimedes/patterns/_registry.yaml`
- Create: `plugins/archimedes/patterns/core/pack.yaml`
- Create: `plugins/archimedes/patterns/aws-serverless/pack.yaml`
- Create: `plugins/archimedes/patterns/iot-core/pack.yaml`
- Create: `plugins/archimedes/patterns/core/scan.sh`
- Create: `plugins/archimedes/patterns/aws-serverless/scan.sh`
- Create: `plugins/archimedes/patterns/iot-core/scan.sh`
- Create: `plugins/archimedes/tools/scripts/run-structure-scan.sh`

- [ ] **Step 1: Create `patterns/_registry.yaml`**

```yaml
# Archimedes Pattern Pack Registry
# Add new packs here. Drop a new directory with pack.yaml + scan.sh + rules/ to register.
packs:
  - name: core
    path: patterns/core
    description: Universal architectural patterns (routes, services, events, HTTP clients, anti-patterns)
    default: true

  - name: aws-serverless
    path: patterns/aws-serverless
    description: AWS Serverless — Lambda, API Gateway, DynamoDB, SQS, SNS, EventBridge, Step Functions, IAM
    default: false

  - name: iot-core
    path: patterns/iot-core
    description: AWS IoT Core — MQTT, Device Shadow, Rules Engine, Greengrass v2, Fleet Provisioning
    default: false
```

- [ ] **Step 2: Create pack manifests**

`patterns/core/pack.yaml`:
```yaml
name: core
version: "1.0.0"
description: Universal architecture patterns applicable across all tech stacks
languages: [javascript, typescript, python, java, go, rust]
defaults:
  kind: PATTERN
  weight_class: HUMAN
  confidence: 0.90
  target_type: FILE
```

`patterns/aws-serverless/pack.yaml`:
```yaml
name: aws-serverless
version: "1.0.0"
description: AWS Serverless patterns — Lambda, API GW, DynamoDB, SQS, SNS, EventBridge, SFN, IAM
languages: [javascript, typescript, python]
defaults:
  kind: PATTERN
  weight_class: HUMAN
  confidence: 0.95
  target_type: FILE
```

`patterns/iot-core/pack.yaml`:
```yaml
name: iot-core
version: "1.0.0"
description: AWS IoT Core — MQTT, Device Shadow, Rules Engine, Greengrass v2, Fleet Provisioning
languages: [javascript, typescript, python, yaml]
defaults:
  kind: PATTERN
  weight_class: HUMAN
  confidence: 0.95
  target_type: FILE
```

- [ ] **Step 3: Create scan.sh for each pack**

`patterns/core/scan.sh` (and repeat structure for `aws-serverless/scan.sh` and `iot-core/scan.sh`):

```bash
#!/bin/bash
# Deterministic scan for the core pattern pack.
# Usage: bash patterns/core/scan.sh <repo-path> <session-id> <db-path>
set -e

REPO=$1; SESSION=$2; DB_PATH=$3
PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$(dirname "$PACK_DIR")")"

if [ -z "$REPO" ] || [ -z "$SESSION" ] || [ -z "$DB_PATH" ]; then
  echo '{"error":"Usage: scan.sh <repo> <session> <db-path>"}' >&2
  exit 1
fi

TAG_COUNT=0

for rule in "$PACK_DIR/rules"/*.yaml; do
  [ -f "$rule" ] || continue
  rule_name=$(basename "$rule" .yaml)

  # Strip archimedes: field so ast-grep doesn't complain about unknown keys
  tmp_rule=$(mktemp /tmp/arch-rule-XXXXXX.yaml)
  yq 'del(.archimedes)' "$rule" > "$tmp_rule"

  written=$(ast-grep scan --rule "$tmp_rule" --json "$REPO" 2>/dev/null \
    | bun "$PLUGIN_ROOT/tools/tag-store.ts" write-from-ast-grep \
        --session "$SESSION" \
        --db "$DB_PATH" \
        --rule "$rule" \
        --source-tool "ast-grep" \
        --target-repo "$REPO" \
    | jq -r '.written // 0')

  rm -f "$tmp_rule"
  TAG_COUNT=$((TAG_COUNT + written))
  [ "$written" -gt 0 ] && echo "  [$rule_name] $written tags" >&2
done

echo "{\"ok\":true,\"pack\":\"core\",\"tags_written\":$TAG_COUNT}"
```

Make all scan.sh files executable:
```bash
chmod +x plugins/archimedes/patterns/core/scan.sh
chmod +x plugins/archimedes/patterns/aws-serverless/scan.sh
chmod +x plugins/archimedes/patterns/iot-core/scan.sh
```

- [ ] **Step 4: Create the top-level scan orchestrator**

`tools/scripts/run-structure-scan.sh`:
```bash
#!/bin/bash
# Top-level deterministic structure scan orchestrator.
# Runs enabled pattern packs against a repo and writes to tag store.
# Usage: bash tools/scripts/run-structure-scan.sh <repo> <session> <db-path> [packs]
set -e

REPO=$1; SESSION=$2; DB_PATH=$3
PACKS=${4:-"core"}  # comma-separated: "core,aws-serverless,iot-core"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"

echo "{\"scan_start\":true,\"repo\":\"$REPO\",\"packs\":\"$PACKS\"}" >&2

for pack in $(echo "$PACKS" | tr ',' '\n'); do
  SCAN_SH="$PLUGIN_ROOT/patterns/$pack/scan.sh"
  if [ -f "$SCAN_SH" ]; then
    echo "Running pack: $pack" >&2
    bash "$SCAN_SH" "$REPO" "$SESSION" "$DB_PATH"
  else
    echo "{\"warning\":\"Pack '$pack' not found at $SCAN_SH\"}" >&2
  fi
done

echo "{\"ok\":true,\"repo\":\"$REPO\",\"session\":\"$SESSION\"}"
```

```bash
chmod +x plugins/archimedes/tools/scripts/run-structure-scan.sh
```

- [ ] **Step 5: Verify yq is available**

```bash
yq --version
```

If not installed: `brew install yq`

- [ ] **Step 6: Commit**

```bash
git add plugins/archimedes/patterns/ plugins/archimedes/tools/scripts/
git commit -m "feat(archimedes): add extensible pattern pack registry and deterministic scan orchestrator"
```

---

### Task 8: Core Pattern Rules

**Files:**
- Create: `plugins/archimedes/patterns/core/rules/` (10 YAML files)
- Create: `plugins/archimedes/tests/patterns/fixtures/sample-express.ts`
- Create: `plugins/archimedes/tests/patterns/fixtures/sample-fastapi.py`
- Create: `plugins/archimedes/tests/patterns/verify-patterns.sh`

- [ ] **Step 1: Create test fixtures**

`tests/patterns/fixtures/sample-express.ts`:
```typescript
import express from "express";
import axios from "axios";
import { EventEmitter } from "events";

const app = express();
const emitter = new EventEmitter();

// Should match: core-http-route-express (2 routes)
app.get("/users/:id", async (req, res) => { res.json({}); });
app.post("/orders", (req, res) => { res.json({ created: true }); });

// Should match: core-axios-call
const response = await axios.get("https://api.example.com/data");

// Should match: core-event-emit + core-event-subscribe
emitter.emit("order.created", { id: "123" });
emitter.on("payment.received", (data) => console.log(data));

// Should match: core-secret-in-env-hardcoded (DEBT)
const apiKey = "AKIA1234567890EXAMPLE";
```

`tests/patterns/fixtures/sample-fastapi.py`:
```python
from fastapi import FastAPI
import requests

app = FastAPI()

# Should match: core-http-route-fastapi (2 routes)
@app.get("/users/{user_id}")
async def get_user(user_id: str):
    return {"user_id": user_id}

@app.post("/orders")
async def create_order():
    response = requests.get("https://api.example.com")  # Should match: core-http-client-py
    return response.json()
```

- [ ] **Step 2: Write core rule files**

`patterns/core/rules/http-route-express.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: http-route-handler
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: core-http-route-express
language: TypeScript
rule:
  any:
    - pattern: app.get($PATH, $$$HANDLERS)
    - pattern: app.post($PATH, $$$HANDLERS)
    - pattern: app.put($PATH, $$$HANDLERS)
    - pattern: app.delete($PATH, $$$HANDLERS)
    - pattern: app.patch($PATH, $$$HANDLERS)
    - pattern: router.get($PATH, $$$HANDLERS)
    - pattern: router.post($PATH, $$$HANDLERS)
```

`patterns/core/rules/http-route-fastapi.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: http-route-handler
  confidence: 0.90
  weight_class: HUMAN
  target_type: FILE
id: core-http-route-fastapi
language: Python
rule:
  any:
    - pattern: "@app.get($PATH)\ndef $FUNC($$$ARGS): $$$BODY"
    - pattern: "@app.post($PATH)\ndef $FUNC($$$ARGS): $$$BODY"
    - pattern: "@router.get($PATH)\ndef $FUNC($$$ARGS): $$$BODY"
    - pattern: "@router.post($PATH)\ndef $FUNC($$$ARGS): $$$BODY"
```

`patterns/core/rules/http-client-ts.yaml`:
```yaml
archimedes:
  kind: DEPENDENCY
  subkind: http-client
  confidence: 0.90
  weight_class: HUMAN
  target_type: FILE
id: core-axios-call
language: TypeScript
rule:
  any:
    - pattern: axios.get($URL, $$$)
    - pattern: axios.post($URL, $$$)
    - pattern: axios.put($URL, $$$)
    - pattern: fetch($URL, $$$)
```

`patterns/core/rules/http-client-py.yaml`:
```yaml
archimedes:
  kind: DEPENDENCY
  subkind: http-client
  confidence: 0.90
  weight_class: HUMAN
  target_type: FILE
id: core-requests-call
language: Python
rule:
  any:
    - pattern: requests.get($URL, $$$)
    - pattern: requests.post($URL, $$$)
    - pattern: httpx.get($URL, $$$)
    - pattern: httpx.post($URL, $$$)
```

`patterns/core/rules/event-emit-ts.yaml`:
```yaml
archimedes:
  kind: DEPENDENCY
  subkind: event-emitter
  confidence: 0.85
  weight_class: HUMAN
  target_type: FILE
id: core-event-emit
language: TypeScript
rule:
  any:
    - pattern: $EMITTER.emit($EVENT, $$$ARGS)
    - pattern: $EMITTER.publish($EVENT, $$$ARGS)
    - pattern: $EMITTER.dispatch($EVENT, $$$ARGS)
```

`patterns/core/rules/event-subscribe-ts.yaml`:
```yaml
archimedes:
  kind: DEPENDENCY
  subkind: event-subscriber
  confidence: 0.85
  weight_class: HUMAN
  target_type: FILE
id: core-event-subscribe
language: TypeScript
rule:
  any:
    - pattern: $EMITTER.on($EVENT, $HANDLER)
    - pattern: $EMITTER.subscribe($EVENT, $HANDLER)
    - pattern: $EMITTER.listen($EVENT, $HANDLER)
```

`patterns/core/rules/repository-class-ts.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: repository-class
  confidence: 0.85
  weight_class: HUMAN
  target_type: FILE
id: core-repository-class
language: TypeScript
rule:
  any:
    - pattern: "class $NAMERepository { $$$BODY }"
    - pattern: "class $NAMERepo { $$$BODY }"
    - pattern: "class $NAMEStore { $$$BODY }"
```

`patterns/core/rules/service-class-ts.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: service-class
  confidence: 0.80
  weight_class: HUMAN
  target_type: FILE
id: core-service-class
language: TypeScript
rule:
  any:
    - pattern: "class $NAMEService { $$$BODY }"
    - pattern: "class $NAMEManager { $$$BODY }"
```

`patterns/core/rules/secret-hardcoded-ts.yaml`:
```yaml
archimedes:
  kind: DEBT
  subkind: hardcoded-credential
  confidence: 0.90
  weight_class: HUMAN
  target_type: FILE
id: core-secret-in-env-hardcoded
language: TypeScript
note: "Hardcoded credential detected — use environment variables or Secrets Manager"
rule:
  any:
    - pattern: "const $VAR = \"AKIA$KEY\""
    - pattern: "const $VAR = \"sk_live_$KEY\""
    - pattern: "const $VAR = \"ghp_$KEY\""
```

`patterns/core/rules/env-var-access-ts.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: env-var-access
  confidence: 0.80
  weight_class: HUMAN
  target_type: FILE
id: core-env-var-access
language: TypeScript
rule:
  pattern: process.env.$VAR
```

- [ ] **Step 3: Create the pattern smoke test script**

`tests/patterns/verify-patterns.sh`:
```bash
#!/bin/bash
# Smoke test: verify patterns match expected fixtures
set -e

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FIXTURES="$PLUGIN_ROOT/tests/patterns/fixtures"
PASS=0; FAIL=0

check() {
  local rule="$1"; local fixture="$2"; local min="$3"; local label="$4"
  local tmp=$(mktemp /tmp/arch-XXXXXX.yaml)
  yq 'del(.archimedes)' "$rule" > "$tmp"
  local count=$(ast-grep scan --rule "$tmp" "$fixture" --json 2>/dev/null | jq 'length')
  rm -f "$tmp"
  if [ "${count:-0}" -ge "$min" ]; then
    echo "✅ $label ($count matches)"; PASS=$((PASS+1))
  else
    echo "❌ $label (expected >=$min, got ${count:-0})"; FAIL=$((FAIL+1))
  fi
}

echo "=== Core Pack ==="
check "$PLUGIN_ROOT/patterns/core/rules/http-route-express.yaml" \
  "$FIXTURES/sample-express.ts" 2 "Core: Express route handlers"
check "$PLUGIN_ROOT/patterns/core/rules/http-route-fastapi.yaml" \
  "$FIXTURES/sample-fastapi.py" 2 "Core: FastAPI route handlers"
check "$PLUGIN_ROOT/patterns/core/rules/http-client-ts.yaml" \
  "$FIXTURES/sample-express.ts" 1 "Core: axios HTTP client"
check "$PLUGIN_ROOT/patterns/core/rules/event-emit-ts.yaml" \
  "$FIXTURES/sample-express.ts" 1 "Core: EventEmitter emit"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
```

```bash
chmod +x plugins/archimedes/tests/patterns/verify-patterns.sh
```

- [ ] **Step 4: Run smoke tests against fixtures**

```bash
cd plugins/archimedes && bash tests/patterns/verify-patterns.sh
```

Expected: All ✅. If any ❌, fix the rule file pattern (common issues: TypeScript vs JavaScript language mismatch, pattern needs `async` keyword, pattern too specific).

- [ ] **Step 5: Commit**

```bash
git add plugins/archimedes/patterns/core/rules/ plugins/archimedes/tests/patterns/
git commit -m "feat(archimedes): add core pattern rules (routes, clients, events, repositories, debt)"
```

---

### Task 9: AWS Serverless Pattern Rules

**Files:**
- Create: `plugins/archimedes/patterns/aws-serverless/rules/` (12 YAML files)
- Create: `plugins/archimedes/tests/patterns/fixtures/sample-lambda.ts`
- Create: `plugins/archimedes/tests/patterns/fixtures/sample-lambda.cjs`
- Create: `plugins/archimedes/tests/patterns/fixtures/sample-aws-services.ts`

- [ ] **Step 1: Create AWS fixtures**

`tests/patterns/fixtures/sample-lambda.ts`:
```typescript
import { Logger } from "@aws-lambda-powertools/logger";
import { APIGatewayProxyEvent, Context } from "aws-lambda";

// Cold start risk: module-level SDK init
const logger = new Logger();
const heavyClient = new SomeSDKClient({ region: "us-east-1" });

// ESM handler
export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
```

`tests/patterns/fixtures/sample-lambda.cjs`:
```javascript
// CJS handler
exports.handler = async (event, context) => {
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
```

`tests/patterns/fixtures/sample-aws-services.ts`:
```typescript
import { DynamoDBClient, GetItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const dynamo = new DynamoDBClient({ region: "us-east-1" });
await dynamo.send(new GetItemCommand({ TableName: "users", Key: {} }));
await dynamo.send(new ScanCommand({ TableName: "orders" }));  // anti-pattern

const sqs = new SQSClient({ region: "us-east-1" });
await sqs.send(new SendMessageCommand({ QueueUrl: "...", MessageBody: "..." }));

export const handler = async (event: { Records: Array<{ body: string }> }) => {
  const message = event.Records[0].body; // SQS trigger signal
};

const sns = new SNSClient({ region: "us-east-1" });
await sns.send(new PublishCommand({ TopicArn: "...", Message: "..." }));

const events = new EventBridgeClient({ region: "us-east-1" });
await events.send(new PutEventsCommand({ Entries: [] }));

const sfn = new SFNClient({ region: "us-east-1" });
await sfn.send(new StartExecutionCommand({ stateMachineArn: "arn:aws:states:...", input: "{}" }));
```

- [ ] **Step 2: Write all AWS Serverless rule files**

`patterns/aws-serverless/rules/lambda-handler-esm.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: lambda-handler
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: aws-lambda-handler-esm
language: TypeScript
rule:
  any:
    - pattern: export const handler = async ($EVENT, $CTX) => { $$$BODY }
    - pattern: export const handler = async ($EVENT: $TYPE, $CTX: $CTXTYPE) => { $$$BODY }
    - pattern: export async function handler($EVENT, $CTX) { $$$BODY }
```

`patterns/aws-serverless/rules/lambda-handler-cjs.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: lambda-handler
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: aws-lambda-handler-cjs
language: JavaScript
rule:
  any:
    - pattern: exports.handler = async ($EVENT, $CTX) => { $$$BODY }
    - pattern: exports.handler = async function($EVENT, $CTX) { $$$BODY }
    - pattern: module.exports.handler = async ($EVENT, $CTX) => { $$$BODY }
```

`patterns/aws-serverless/rules/lambda-handler-py.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: lambda-handler
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: aws-lambda-handler-python
language: Python
rule:
  any:
    - pattern: "def handler($EVENT, $CONTEXT): $$$BODY"
    - pattern: "async def handler($EVENT, $CONTEXT): $$$BODY"
```

`patterns/aws-serverless/rules/lambda-powertools.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: lambda-powertools
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: aws-lambda-powertools
language: TypeScript
rule:
  any:
    - pattern: "import { Logger } from \"@aws-lambda-powertools/logger\""
    - pattern: "import { Tracer } from \"@aws-lambda-powertools/tracer\""
    - pattern: "import { Metrics } from \"@aws-lambda-powertools/metrics\""
```

`patterns/aws-serverless/rules/lambda-cold-start-risk.yaml`:
```yaml
archimedes:
  kind: DEBT
  subkind: lambda-cold-start-risk
  confidence: 0.70
  weight_class: MACHINE
  target_type: FILE
id: aws-lambda-cold-start-module-client
language: TypeScript
note: "Module-level SDK client init runs on every cold start — move inside handler if possible"
rule:
  pattern: "const $VAR = new $CLIENT({ region: $REGION })"
  not:
    inside:
      any:
        - kind: function_declaration
        - kind: arrow_function
        - kind: function_expression
```

`patterns/aws-serverless/rules/dynamodb-v3.yaml`:
```yaml
archimedes:
  kind: DEPENDENCY
  subkind: dynamodb-client
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: aws-dynamodb-v3-send
language: TypeScript
rule:
  any:
    - pattern: $CLIENT.send(new GetItemCommand($$$))
    - pattern: $CLIENT.send(new PutItemCommand($$$))
    - pattern: $CLIENT.send(new QueryCommand($$$))
    - pattern: $CLIENT.send(new UpdateItemCommand($$$))
```

`patterns/aws-serverless/rules/dynamodb-scan-antipattern.yaml`:
```yaml
archimedes:
  kind: DEBT
  subkind: dynamodb-full-scan
  confidence: 0.85
  weight_class: HUMAN
  target_type: FILE
id: aws-dynamodb-scan
language: TypeScript
note: "DynamoDB Scan reads entire table — expensive at scale, replace with Query + GSI"
rule:
  pattern: $CLIENT.send(new ScanCommand($$$))
```

`patterns/aws-serverless/rules/sqs-producer.yaml`:
```yaml
archimedes:
  kind: DEPENDENCY
  subkind: sqs-producer
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: aws-sqs-send-message
language: TypeScript
rule:
  pattern: $CLIENT.send(new SendMessageCommand($$$))
```

`patterns/aws-serverless/rules/sqs-lambda-trigger.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: sqs-consumer
  confidence: 0.90
  weight_class: HUMAN
  target_type: FILE
id: aws-sqs-lambda-trigger
language: TypeScript
rule:
  pattern: $EVENT.Records[0].body
```

`patterns/aws-serverless/rules/sns-publish.yaml`:
```yaml
archimedes:
  kind: DEPENDENCY
  subkind: sns-publisher
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: aws-sns-publish
language: TypeScript
rule:
  pattern: $CLIENT.send(new PublishCommand($$$))
```

`patterns/aws-serverless/rules/eventbridge-put.yaml`:
```yaml
archimedes:
  kind: DEPENDENCY
  subkind: eventbridge-producer
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: aws-eventbridge-put-events
language: TypeScript
rule:
  pattern: $CLIENT.send(new PutEventsCommand($$$))
```

`patterns/aws-serverless/rules/step-functions-invoke.yaml`:
```yaml
archimedes:
  kind: DEPENDENCY
  subkind: step-functions-invoker
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: aws-sfn-start-execution
language: TypeScript
rule:
  pattern: $CLIENT.send(new StartExecutionCommand($$$))
```

`patterns/aws-serverless/rules/iam-wildcard.yaml`:
```yaml
archimedes:
  kind: DEBT
  subkind: iam-wildcard
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: aws-iam-wildcard-action
language: Yaml
note: "IAM wildcard Action is a security anti-pattern — scope permissions to specific actions"
rule:
  pattern: "Action: \"*\""
```

- [ ] **Step 3: Add AWS pattern checks to verify-patterns.sh**

Append to `tests/patterns/verify-patterns.sh` before the final echo:
```bash
echo ""
echo "=== AWS Serverless Pack ==="
check "$PLUGIN_ROOT/patterns/aws-serverless/rules/lambda-handler-esm.yaml" \
  "$FIXTURES/sample-lambda.ts" 1 "AWS: Lambda ESM handler"
check "$PLUGIN_ROOT/patterns/aws-serverless/rules/lambda-handler-cjs.yaml" \
  "$FIXTURES/sample-lambda.cjs" 1 "AWS: Lambda CJS handler"
check "$PLUGIN_ROOT/patterns/aws-serverless/rules/dynamodb-v3.yaml" \
  "$FIXTURES/sample-aws-services.ts" 1 "AWS: DynamoDB v3 client"
check "$PLUGIN_ROOT/patterns/aws-serverless/rules/dynamodb-scan-antipattern.yaml" \
  "$FIXTURES/sample-aws-services.ts" 1 "AWS: DynamoDB Scan anti-pattern"
check "$PLUGIN_ROOT/patterns/aws-serverless/rules/sqs-producer.yaml" \
  "$FIXTURES/sample-aws-services.ts" 1 "AWS: SQS SendMessage"
check "$PLUGIN_ROOT/patterns/aws-serverless/rules/sns-publish.yaml" \
  "$FIXTURES/sample-aws-services.ts" 1 "AWS: SNS Publish"
check "$PLUGIN_ROOT/patterns/aws-serverless/rules/eventbridge-put.yaml" \
  "$FIXTURES/sample-aws-services.ts" 1 "AWS: EventBridge PutEvents"
check "$PLUGIN_ROOT/patterns/aws-serverless/rules/step-functions-invoke.yaml" \
  "$FIXTURES/sample-aws-services.ts" 1 "AWS: SFN StartExecution"
```

- [ ] **Step 4: Run full smoke test**

```bash
cd plugins/archimedes && bash tests/patterns/verify-patterns.sh
```

Expected: All ✅.

- [ ] **Step 5: Commit**

```bash
git add plugins/archimedes/patterns/aws-serverless/ plugins/archimedes/tests/patterns/fixtures/
git commit -m "feat(archimedes): add complete AWS Serverless pattern rules with fixtures"
```

---

### Task 10: IoT Core + Greengrass v2 Pattern Rules

**Files:**
- Create: `plugins/archimedes/patterns/iot-core/rules/` (13 YAML files)
- Create: `plugins/archimedes/tests/patterns/fixtures/sample-mqtt.ts`
- Create: `plugins/archimedes/tests/patterns/fixtures/sample-ggv2.py`
- Create: `plugins/archimedes/tests/patterns/fixtures/sample-iot-cfn.yaml`

- [ ] **Step 1: Create IoT fixtures**

`tests/patterns/fixtures/sample-mqtt.ts`:
```typescript
import * as mqtt from "mqtt";
import * as awsIot from "aws-iot-device-sdk-v2";
import { iotshadow } from "aws-iot-device-sdk-v2";

// Should match: iot-mqtt-connect
const client = mqtt.connect("mqtts://endpoint.iot.region.amazonaws.com");
const device = new awsIot.mqtt.MqttClient();

// Should match: iot-mqtt-subscribe
client.subscribe("device/+/telemetry");
client.subscribe("#");  // Should match: iot-mqtt-wildcard-antipattern

// Should match: iot-mqtt-publish
client.publish("device/sensor-1/telemetry", JSON.stringify({ temp: 22.5 }), { qos: 0 });

// Should match: iot-device-shadow
const shadowClient = new iotshadow.IotShadowClient(connection);
await shadowClient.publishGetNamedShadow({ thingName: "device-001", shadowName: "reported" }, 1);
await shadowClient.publishUpdateNamedShadow({ thingName: "device-001", shadowName: "reported", state: {} }, 1);
```

`tests/patterns/fixtures/sample-ggv2.py`:
```python
from awsiot.greengrasscoreipc.clientv2 import GreengrassCoreIPCClientV2
from awsiot.greengrasscoreipc.model import (
    SubscribeToTopicRequest,
    PublishToTopicRequest,
    GetConfigurationRequest,
    GetThingShadowRequest,
    UpdateThingShadowRequest,
    SubscribeToIoTCoreRequest,
    PublishToIoTCoreRequest,
)

# Should match: ggv2-ipc-client-python
ipc_client = GreengrassCoreIPCClientV2()

# Should match: ggv2-ipc-pubsub
ipc_client.subscribe_to_topic(topic="local/sensor/data", on_stream_event=handler)
ipc_client.publish_to_topic(topic="local/processed/data", publish_message=payload)

# Should match: ggv2-ipc-config
config = ipc_client.get_configuration(key_path=["sampleConfig"])

# Should match: ggv2-ipc-shadow
shadow = ipc_client.get_thing_shadow(thing_name="my-device", shadow_name="reported")
ipc_client.update_thing_shadow(thing_name="my-device", shadow_name="reported", payload=b"{}")

# Should match: ggv2-ipc-iotcore
ipc_client.subscribe_to_iot_core(topic_name="cloud/commands", qos=0, on_stream_event=handler)
ipc_client.publish_to_iot_core(topic_name="cloud/telemetry", qos=0, payload=b"{}")

# Should match: ggv2-v1-sdk-antipattern (DEBT)
import aws_greengrass_core_sdk
```

`tests/patterns/fixtures/sample-iot-cfn.yaml`:
```yaml
Resources:
  TelemetryRule:
    Type: AWS::IoT::TopicRule
    Properties:
      TopicRulePayload:
        Sql: "SELECT * FROM 'device/+/telemetry'"
        Actions:
          - Lambda:
              FunctionArn: !GetAtt ProcessorFunction.Arn

  DeviceComponentVersion:
    Type: AWS::GreengrassV2::ComponentVersion
    Properties:
      InlineRecipe:
        ComponentName: com.example.TelemetryProcessor

  GreengrassDeployment:
    Type: AWS::GreengrassV2::Deployment
    Properties:
      TargetArn: !Sub "arn:aws:iot:${AWS::Region}:${AWS::AccountId}:thinggroup/devices"
```

- [ ] **Step 2: Write all IoT Core rule files**

`patterns/iot-core/rules/mqtt-connect.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: mqtt-connection
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: iot-mqtt-connect
language: TypeScript
rule:
  any:
    - pattern: mqtt.connect($URL)
    - pattern: mqtt.connect($URL, $OPTIONS)
    - pattern: new awsIot.mqtt.MqttClient()
```

`patterns/iot-core/rules/mqtt-subscribe.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: mqtt-subscriber
  confidence: 0.90
  weight_class: HUMAN
  target_type: FILE
id: iot-mqtt-subscribe
language: TypeScript
rule:
  pattern: $CLIENT.subscribe($TOPIC, $$$)
```

`patterns/iot-core/rules/mqtt-publish.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: mqtt-publisher
  confidence: 0.90
  weight_class: HUMAN
  target_type: FILE
id: iot-mqtt-publish
language: TypeScript
rule:
  pattern: $CLIENT.publish($TOPIC, $PAYLOAD, $$$)
```

`patterns/iot-core/rules/mqtt-wildcard-antipattern.yaml`:
```yaml
archimedes:
  kind: DEBT
  subkind: mqtt-wildcard-subscription
  confidence: 0.90
  weight_class: HUMAN
  target_type: FILE
id: iot-mqtt-wildcard
language: TypeScript
note: "Subscribing to '#' receives ALL messages — security and performance anti-pattern"
rule:
  pattern: $CLIENT.subscribe("#", $$$)
```

`patterns/iot-core/rules/device-shadow-ts.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: device-shadow
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: iot-device-shadow-ts
language: TypeScript
rule:
  any:
    - pattern: $CLIENT.publishGetNamedShadow($$$)
    - pattern: $CLIENT.publishUpdateNamedShadow($$$)
    - pattern: $CLIENT.publishGetShadow($$$)
    - pattern: $CLIENT.publishUpdateShadow($$$)
```

`patterns/iot-core/rules/iot-rules-engine.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: iot-rules-engine
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: iot-cfn-topic-rule
language: Yaml
rule:
  pattern: "Type: AWS::IoT::TopicRule"
```

`patterns/iot-core/rules/ggv2-ipc-client-py.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: greengrass-v2-ipc
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: ggv2-ipc-client-python
language: Python
rule:
  pattern: GreengrassCoreIPCClientV2()
```

`patterns/iot-core/rules/ggv2-ipc-pubsub-py.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: greengrass-v2-pubsub
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: ggv2-ipc-pubsub-python
language: Python
rule:
  any:
    - pattern: $CLIENT.subscribe_to_topic($$$)
    - pattern: $CLIENT.publish_to_topic($$$)
```

`patterns/iot-core/rules/ggv2-ipc-iotcore-py.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: greengrass-v2-iotcore-bridge
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: ggv2-ipc-iotcore-python
language: Python
rule:
  any:
    - pattern: $CLIENT.subscribe_to_iot_core($$$)
    - pattern: $CLIENT.publish_to_iot_core($$$)
```

`patterns/iot-core/rules/ggv2-ipc-config-py.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: greengrass-v2-config
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: ggv2-ipc-config-python
language: Python
rule:
  any:
    - pattern: $CLIENT.get_configuration($$$)
    - pattern: $CLIENT.subscribe_to_configuration_update($$$)
    - pattern: $CLIENT.update_configuration($$$)
```

`patterns/iot-core/rules/ggv2-ipc-shadow-py.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: greengrass-v2-shadow
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: ggv2-ipc-shadow-python
language: Python
rule:
  any:
    - pattern: $CLIENT.get_thing_shadow($$$)
    - pattern: $CLIENT.update_thing_shadow($$$)
    - pattern: $CLIENT.delete_thing_shadow($$$)
```

`patterns/iot-core/rules/ggv2-cfn-resources.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: greengrass-v2-deployment
  confidence: 0.95
  weight_class: HUMAN
  target_type: FILE
id: ggv2-cfn-resources
language: Yaml
rule:
  any:
    - pattern: "Type: AWS::GreengrassV2::ComponentVersion"
    - pattern: "Type: AWS::GreengrassV2::Deployment"
```

`patterns/iot-core/rules/ggv2-v1-sdk-antipattern.yaml`:
```yaml
archimedes:
  kind: DEBT
  subkind: greengrass-v1-sdk-in-v2-project
  confidence: 0.85
  weight_class: HUMAN
  target_type: FILE
id: ggv2-v1-sdk-import
language: Python
note: "aws_greengrass_core_sdk is the v1 SDK — migrate to awsiot.greengrasscoreipc for Greengrass v2"
rule:
  pattern: "import aws_greengrass_core_sdk"
```

- [ ] **Step 3: Add IoT checks to verify-patterns.sh**

Append before the final echo:
```bash
echo ""
echo "=== IoT Core Pack ==="
check "$PLUGIN_ROOT/patterns/iot-core/rules/mqtt-connect.yaml" \
  "$FIXTURES/sample-mqtt.ts" 1 "IoT: MQTT connect"
check "$PLUGIN_ROOT/patterns/iot-core/rules/mqtt-subscribe.yaml" \
  "$FIXTURES/sample-mqtt.ts" 1 "IoT: MQTT subscribe"
check "$PLUGIN_ROOT/patterns/iot-core/rules/mqtt-wildcard-antipattern.yaml" \
  "$FIXTURES/sample-mqtt.ts" 1 "IoT: MQTT wildcard anti-pattern"
check "$PLUGIN_ROOT/patterns/iot-core/rules/device-shadow-ts.yaml" \
  "$FIXTURES/sample-mqtt.ts" 1 "IoT: Device Shadow operations"
check "$PLUGIN_ROOT/patterns/iot-core/rules/ggv2-ipc-client-py.yaml" \
  "$FIXTURES/sample-ggv2.py" 1 "IoT: GGv2 IPC client"
check "$PLUGIN_ROOT/patterns/iot-core/rules/ggv2-ipc-pubsub-py.yaml" \
  "$FIXTURES/sample-ggv2.py" 1 "IoT: GGv2 IPC pub/sub"
check "$PLUGIN_ROOT/patterns/iot-core/rules/ggv2-ipc-iotcore-py.yaml" \
  "$FIXTURES/sample-ggv2.py" 1 "IoT: GGv2 IPC → IoT Core bridge"
check "$PLUGIN_ROOT/patterns/iot-core/rules/ggv2-ipc-config-py.yaml" \
  "$FIXTURES/sample-ggv2.py" 1 "IoT: GGv2 IPC config access"
check "$PLUGIN_ROOT/patterns/iot-core/rules/ggv2-ipc-shadow-py.yaml" \
  "$FIXTURES/sample-ggv2.py" 1 "IoT: GGv2 IPC shadow operations"
check "$PLUGIN_ROOT/patterns/iot-core/rules/ggv2-cfn-resources.yaml" \
  "$FIXTURES/sample-iot-cfn.yaml" 1 "IoT: GGv2 CloudFormation resources"
check "$PLUGIN_ROOT/patterns/iot-core/rules/ggv2-v1-sdk-antipattern.yaml" \
  "$FIXTURES/sample-ggv2.py" 1 "IoT: GGv2 v1 SDK import (DEBT)"
check "$PLUGIN_ROOT/patterns/iot-core/rules/iot-rules-engine.yaml" \
  "$FIXTURES/sample-iot-cfn.yaml" 1 "IoT: Rules Engine (CFn)"
```

- [ ] **Step 4: Run complete smoke test suite**

```bash
cd plugins/archimedes && bash tests/patterns/verify-patterns.sh
```

Expected: All ✅ across Core, AWS Serverless, and IoT Core packs.

- [ ] **Step 5: Commit**

```bash
git add plugins/archimedes/patterns/iot-core/ plugins/archimedes/tests/patterns/fixtures/
git commit -m "feat(archimedes): add IoT Core + Greengrass v2 pattern rules (MQTT, shadow, IPC, CFn, anti-patterns)"
```

---

### Task 11: Cookbook — Tag Store + AST-grep Reference

**Files:**
- Create: `plugins/archimedes/cookbook/tag-store/schema.md`
- Create: `plugins/archimedes/cookbook/tag-store/queries.md`
- Create: `plugins/archimedes/cookbook/ast-grep/cli.md`
- Create: `plugins/archimedes/cookbook/ast-grep/patterns.md`

- [ ] **Step 1: Write `cookbook/tag-store/schema.md`**

Document every field in the tag schema with type, allowed values, and example. Include: tag lifecycle states (CANDIDATE → VALIDATED → PROMOTED → REJECTED/STALE), weight classes (HUMAN/MACHINE/PROMOTED), confidence gradient table (IaC: 0.95, Docker/K8s: 0.85, code imports: 0.70, docs: 0.60, semantic: 0.50).

- [ ] **Step 2: Write `cookbook/tag-store/queries.md`**

Write ≥20 SQL query templates as copy-paste blocks. Include:
- All PATTERN tags for a repo: `SELECT * FROM tags WHERE target_repo=? AND kind='PATTERN' AND status!='REJECTED'`
- Technology stack summary: `SELECT json_extract(value, '$.pattern_name'), COUNT(*) FROM tags WHERE kind='PATTERN' GROUP BY 1`
- Top debt by confidence: `SELECT target_ref, json_extract(value,'$.subkind'), confidence FROM tags WHERE kind='DEBT' ORDER BY confidence DESC LIMIT 20`
- CANDIDATE tags pending review: `SELECT * FROM tags WHERE status='CANDIDATE' ORDER BY confidence DESC`
- Cross-repo dependency graph: `SELECT source.target_repo, target.target_repo, source.kind FROM tags source JOIN tags target ON ...`
- Tag count by kind and status: `SELECT kind, status, COUNT(*), AVG(confidence) FROM tags GROUP BY kind, status`
- Human-weight facts only: `SELECT * FROM tags WHERE weight_class IN ('HUMAN','PROMOTED') AND status='VALIDATED'`

- [ ] **Step 3: Write `cookbook/ast-grep/cli.md`**

Document: `ast-grep scan --rule <file> --json <path>`, `ast-grep scan --rule <file> --json <path> | jq 'length'`, how to strip the `archimedes:` field with `yq 'del(.archimedes)' rule.yaml > /tmp/rule.yaml`, how to test a single rule interactively.

- [ ] **Step 4: Write `cookbook/ast-grep/patterns.md`**

Document: how to write a new rule file (required fields: `id`, `language`, `rule`, `archimedes:`), the `archimedes:` metadata fields, pattern syntax (`$VAR`, `$$$ARGS`, `any:`, `not:`, `inside:`), how to test against a fixture, how to add to `verify-patterns.sh`.

- [ ] **Step 5: Commit**

```bash
git add plugins/archimedes/cookbook/
git commit -m "feat(archimedes): add tag store and ast-grep cookbook reference"
```

---

### Task 12: arch-tags Skill + arch-structure Skill

**Files:**
- Create: `plugins/archimedes/skills/arch-tags/SKILL.md`
- Create: `plugins/archimedes/skills/arch-structure/SKILL.md`
- Create: `plugins/archimedes/agents/structure-agent.md`

- [ ] **Step 1: Write `skills/arch-tags/SKILL.md`**

This is the meta-skill. Structure:
```markdown
---
description: Tag store CRUD — read, write, query, promote, reject, export architectural findings
---
# arch-tags

## Purpose
The tag store is the shared memory between all Archimedes skills. Every skill reads from
and writes to it. arch-tags provides the operations to interact with it.

## Commands
[Document each tag-store.ts command with exact invocation and example output]

## Common Queries
[Reference cookbook/tag-store/queries.md — include the 10 most commonly used queries inline]

## Tag Lifecycle
[Diagram: CANDIDATE → VALIDATED → PROMOTED, CANDIDATE → REJECTED, VALIDATED → STALE]

## Weight Classes
[Table: HUMAN (deterministic, skip review), MACHINE (needs review), PROMOTED (reviewed MACHINE)]
```

- [ ] **Step 2: Write `skills/arch-structure/SKILL.md`**

```markdown
---
description: Deterministic structural analysis using ast-grep. Runs pattern packs against a repo
and writes PATTERN/DEPENDENCY/DEBT tags directly to the tag store. No LLM in the write path.
---
# arch-structure

## Purpose
Run deterministic pattern matching against a repository. Tags are written by scripts,
not inferred by agents — zero hallucination risk for the fact-gathering step.

## Usage
Agents: DO NOT run ast-grep directly. Call the scan orchestrator:
  bash tools/scripts/run-structure-scan.sh <repo> <session> <db-path> <packs>

## What it produces
- PATTERN tags (weight: HUMAN, status: VALIDATED) for route handlers, Lambda functions, etc.
- DEPENDENCY tags (weight: HUMAN) for DynamoDB clients, SQS producers, etc.
- DEBT tags (weight: HUMAN) for anti-patterns (scans, wildcards, hardcoded credentials)

## After the scan
Query the tag store for a summary:
  bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
    --sql "SELECT kind, COUNT(*) as count FROM tags WHERE target_repo='$REPO' GROUP BY kind"

## Pattern packs
Read patterns/_registry.yaml for available packs.
Session meta.json specifies which packs are enabled for this session.
```

- [ ] **Step 3: Write `agents/structure-agent.md`**

```markdown
# Structure Agent

You are the Archimedes structure agent. You run deterministic structural analysis
against one repository. Your job is to run the scan and report the summary.
You do NOT interpret findings — that is the orchestrator's job.

## Your task
1. Read session meta: `cat .archimedes/sessions/$SESSION/meta.json`
2. Extract: db_path, pattern_packs
3. Run the scan orchestrator:
   `bash tools/scripts/run-structure-scan.sh $REPO $SESSION $DB_PATH $PACKS`
4. Query tag counts:
   `bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
     --sql "SELECT kind, COUNT(*) as count, AVG(confidence) as avg_conf FROM tags WHERE target_repo='$REPO' GROUP BY kind"`
5. Report to orchestrator: JSON summary of tag counts by kind.

## Guardrails
- Never read source files directly to infer architecture
- Never write tags manually — only via the scan orchestrator
- If scan.sh errors on a pack, log the warning and continue with remaining packs
- Report exactly what the tag store contains — no interpretation
```

- [ ] **Step 4: Commit**

```bash
git add plugins/archimedes/skills/ plugins/archimedes/agents/structure-agent.md
git commit -m "feat(archimedes): add arch-tags and arch-structure skills, structure agent"
```

---

### Task 13: Phase 1 End-to-End Validation

- [ ] **Step 1: Run full test suite**

```bash
cd plugins/archimedes && bun test && bash tests/patterns/verify-patterns.sh
```

Expected: All PASS. Fix any failures before proceeding.

- [ ] **Step 2: Initialize a session against a real Delos repo**

Pick one Delos service repo. Run:
```bash
bun plugins/archimedes/tools/session-init.ts \
  --repos /path/to/delos/service-repo \
  --packs "core,aws-serverless,iot-core"
```

Note the `session_id` from output.

- [ ] **Step 3: Run structure scan**

```bash
bash plugins/archimedes/tools/scripts/run-structure-scan.sh \
  /path/to/delos/service-repo \
  <session_id> \
  .archimedes/sessions/<session_id>/tags.db \
  "core,aws-serverless,iot-core"
```

Watch for any scan.sh errors. All packs should complete without error.

- [ ] **Step 4: Query and inspect results**

```bash
# Tag counts by kind
bun plugins/archimedes/tools/tag-store.ts query \
  --session <session_id> \
  --db .archimedes/sessions/<session_id>/tags.db \
  --sql "SELECT kind, COUNT(*) as count, AVG(confidence) as avg_conf FROM tags GROUP BY kind"

# Top patterns found
bun plugins/archimedes/tools/tag-store.ts query \
  --session <session_id> \
  --db .archimedes/sessions/<session_id>/tags.db \
  --sql "SELECT json_extract(value,'$.pattern_name') as pattern, COUNT(*) as count FROM tags WHERE kind='PATTERN' GROUP BY pattern ORDER BY count DESC"

# Debt findings
bun plugins/archimedes/tools/tag-store.ts query \
  --session <session_id> \
  --db .archimedes/sessions/<session_id>/tags.db \
  --sql "SELECT target_ref, json_extract(value,'$.subkind') as issue, confidence FROM tags WHERE kind='DEBT' ORDER BY confidence DESC"
```

- [ ] **Step 5: Validate quality**

Check: Are Lambda handlers detected? DynamoDB clients? IoT/MQTT patterns? Are DEBT findings real issues, not false positives? If patterns miss expected findings, diagnose: check fixture smoke tests first, then inspect actual source files to verify ast-grep pattern syntax.

- [ ] **Step 6: Run `/arch-assess` command**

```bash
/arch-assess /path/to/delos/service-repo --session <session_id>
```

Verify the service profile output is coherent and useful.

- [ ] **Step 7: Phase 1 gate: commit and tag**

If findings are accurate and the profile is useful:

```bash
git add -A plugins/archimedes/
git commit -m "feat(archimedes): Phase 1 complete — tag store + deterministic patterns working end-to-end"
git tag archimedes-phase1-complete
```

---

## Chunk 2: Phase 2 — Semantic Layer (Weeks 5–8)

*Plan in detail when Phase 1 gate passes. Scope:*

**Deliverables:**
- `skills/arch-search/SKILL.md` — code-chunk chunking → ColGREP index → query → DEPENDENCY/CAPABILITY tags
- `skills/arch-docs/SKILL.md` — qmd docs index + rlmgrep queries → FLOW/DEBT/RISK tags
- `agents/search-agent.md` + `agents/docs-agent.md`
- `skills/arch-map-service/SKILL.md` — first workflow skill (structure → search → observe)
- `cookbook/colgrep/cli.md`, `cookbook/qmd/cli.md`, `cookbook/rlmgrep/cli.md`

**Key decisions to make at Phase 2 planning:**
1. Index lifecycle: does ColGREP index persist between sessions or rebuild per session?
2. Chunking strategy: what chunk sizes/overlap work best for architecture queries?
3. Query templates: which semantic queries surface the most architectural signal?

**Phase 2 gate:** Semantic scan on same Delos repo from Phase 1 adds ≥10 CANDIDATE tags not found by ast-grep.

---

## Chunk 3: Phase 3 — Agentic Layer (Weeks 9–12)

*Plan in detail when Phase 2 gate passes. Scope:*

**Deliverables:**
- `skills/arch-observe/SKILL.md` + `agents/observe-agent.md` — osgrep role classification + call-chain
- `skills/arch-navigate/SKILL.md` + `agents/navigate-agent.md` — Serena LSP symbolic navigation
- `skills/arch-flows/SKILL.md` + `agents/flow-agent.md` — Rivière flow schema synthesis
- `skills/arch-trace-flow/SKILL.md` — workflow: navigate → search → docs → flows
- `skills/arch-assess-debt/SKILL.md` — workflow: structure → observe → docs → debt assessment
- `cookbook/osgrep/cli.md`, `cookbook/serena/cli.md`

**Key decisions for Phase 3 planning:**
1. osgrep daemon lifecycle: start/stop managed by session-init or by skill at invocation time?
2. LSP server config: Serena needs language server configured per language — how is this templated for Delos's stack?
3. Rivière schema coverage boundary: what percentage auto-populates from tags vs needs human architectural judgment?

**Phase 3 gate:** `arch-trace-flow` produces a valid Rivière schema for ≥1 operation flow in Delos.

---

## Chunk 4: Phase 4 — Autonomy (Weeks 13–16)

*Plan in detail when Phase 3 gate passes. Scope:*

**Deliverables:**
- `skills/arch-modernize/SKILL.md` + 6 step files (session-init, structure-scan, semantic-search, agentic-explore, flow-synthesis, report-generate)
- `skills/arch-investigate/SKILL.md` — open-ended investigation with time-bounded sessions
- `skills/arch-map-infra/SKILL.md` — IaC-first topology extraction
- `tools/report-generate.ts` — generates all 5 client deliverables
- End-to-end validation on full Delos codebase (367+ repos, 60-min time limit)
- Client-facing deliverable templates

**Phase 4 gate:**
- `/arch-modernize` on full Delos codebase completes within 60 minutes
- All 5 deliverables generated
- 100% of recommendations linked to tag IDs
- ≥80% of IaC-declared cross-service dependencies mapped in Rivière flows
