# Archimedes Phase 2: Semantic Layer Implementation Plan

> **For Claude:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add chunkhound-powered semantic search (Tier 2) to Archimedes; Phase 2 gate: ≥10 CANDIDATE tags on wellcube-device-data-processing not found by ast-grep in Phase 1.

**Architecture:** Query packs mirror pattern pack architecture exactly — `queries/` mirrors `patterns/` with per-pack `pack.yaml`, `rules/*.yaml` (query text + top_k instead of ast-grep rules), and `scan.sh` (chunkhound orchestration). A new `write-from-chunkhound` command in tag-store.ts parallels `write-from-ast-grep`. The chunkhound index persists at `$REPO/.archimedes/index/chunkhound.db`. Orchestrator `tools/run-semantic-scan.sh` mirrors `tools/scripts/run-structure-scan.sh`.

**Tech Stack:** chunkhound 4.0.1 (`~/.local/bin/chunkhound`, DuckDB backend, text-embedding-3-small), tag-store.ts (Bun + TypeScript), bash, YAML, yq

---

## File Map

```
plugins/archimedes/
├── tools/
│   ├── tag-store.ts                          MODIFY: add write-from-chunkhound command
│   └── run-semantic-scan.sh                  CREATE: orchestrator (mirrors run-structure-scan.sh)
├── cookbook/
│   └── chunkhound/
│       └── cli.md                            CREATE: CLI reference for scan.sh authors
├── queries/
│   ├── _registry.yaml                        CREATE: pack registry (mirrors patterns/_registry.yaml)
│   ├── core/
│   │   ├── pack.yaml                         CREATE
│   │   ├── scan.sh                           CREATE
│   │   └── rules/ (10 rules)                 CREATE: sequelize-model, livr-validation,
│   │                                                  chista-service, poller-pattern,
│   │                                                  express-route, repository-class,
│   │                                                  service-class, event-handler,
│   │                                                  http-client, config-loader
│   ├── aws-serverless/
│   │   ├── pack.yaml                         CREATE
│   │   ├── scan.sh                           CREATE
│   │   └── rules/ (10 rules)                 CREATE: mongodb-client, mongodb-multi-db,
│   │                                                  athena-cte-builder, redshift-copy-loader,
│   │                                                  firehose-transform, score-calculator,
│   │                                                  storage-router, secrets-injection,
│   │                                                  lambda-powertools, dynamodb-query-pattern
│   ├── delos-platform/
│   │   ├── pack.yaml                         CREATE
│   │   ├── scan.sh                           CREATE
│   │   └── rules/ (7 rules)                  CREATE: nva-executor, corechannel-client,
│   │                                                  pluginchannel-router, capability-definition,
│   │                                                  devices-nva-repo, watcher-trigger,
│   │                                                  nva-parse-match
│   └── iot-core/
│       ├── pack.yaml                         CREATE
│       ├── scan.sh                           CREATE
│       └── rules/ (6 rules)                  CREATE: lwm2m-decoder, otbr-integration,
│                                                      greengrass-component, device-snapshot,
│                                                      cellular-management, mqtt-device-shadow
├── skills/
│   ├── arch-search/
│   │   └── SKILL.md                          CREATE: semantic scan skill
│   └── arch-map-service/
│       └── SKILL.md                          CREATE: full two-tier pipeline skill
└── agents/
    └── search-agent.md                       CREATE: semantic search agent persona
```

---

## Chunk 1: Foundations

### Task 1: chunkhound CLI Cookbook

**Files:**
- Create: `cookbook/chunkhound/cli.md`

- [ ] **Step 1: Verify chunkhound index and search output formats**

```bash
# Confirm version and available commands
~/.local/bin/chunkhound --version
~/.local/bin/chunkhound search --help

# Build a quick test index on a small directory to see output format
mkdir -p /tmp/arch-test-search
echo 'const client = new MongoClient(uri); await client.connect();' > /tmp/arch-test-search/test.ts
~/.local/bin/chunkhound index /tmp/arch-test-search --db /tmp/arch-test-search/chunks.db
~/.local/bin/chunkhound search "MongoDB database client connection" /tmp/arch-test-search \
  --db /tmp/arch-test-search/chunks.db \
  --semantic \
  --page-size 3 2>&1
rm -rf /tmp/arch-test-search
```

Expected output: JSON array with objects containing `file` + content/snippet fields. Capture the exact field names from the actual output — use them verbatim in Task 2's write-from-chunkhound implementation.

- [ ] **Step 2: Write cookbook**

Create `cookbook/chunkhound/cli.md`:

```markdown
# chunkhound CLI Reference

> Internal reference for arch-search scan.sh scripts.
> **DO NOT load this file** unless you are authoring new query pack scan.sh scripts.
> Load `skills/arch-search/SKILL.md` instead for running scans.

## Installation

Binary: `~/.local/bin/chunkhound` (also `code-chunkhound`)
Version: chunkhound 4.0.1
Verify: `chunkhound --version`

If `chunkhound: command not found`:
```bash
export PATH="$HOME/.local/bin:$PATH"
```

## Index Command

Builds a DuckDB vector embedding index for a repository.

```bash
chunkhound index <repo_path> --db <index_db_path>
```

Example:
```bash
chunkhound index /path/to/repo \
  --db /path/to/repo/.archimedes/index/chunkhound.db
```

- Default model: `text-embedding-3-small`
- Requires `OPENAI_API_KEY` env var (or `--api-key`)
- Idempotent: re-run updates changed files (mtimes tracked)
- DB format: DuckDB (not SQLite)
- Index convention: `$REPO/.archimedes/index/chunkhound.db`

## Search Command

Runs a semantic similarity query against the index.

```bash
chunkhound search "<query>" <repo_path> \
  --db <index_db_path> \
  --semantic \
  --page-size <N>
```

Example:
```bash
chunkhound search "MongoDB database client connection" /path/to/repo \
  --db /path/to/repo/.archimedes/index/chunkhound.db \
  --semantic \
  --page-size 5
```

### Output Format

JSON array. Each element has at minimum:

| Field | Type | Description |
|-------|------|-------------|
| `file` | string | Absolute file path (full path, not relative) |
| `content` | string | Matching code chunk |
| `score` | number | Cosine similarity (0–1), higher = better match |

> **NOTE**: Verify actual field names against `chunkhound search --help` output when
> implementing write-from-chunkhound in tag-store.ts. Field names confirmed at:
> [update with actual fields from Task 1 Step 1 verification]

### Stale Index Detection

```bash
# Index missing
[ ! -f "$REPO/.archimedes/index/chunkhound.db" ] && echo "needs_build"

# Index older than 7 days
find "$REPO/.archimedes/index/" -name "chunkhound.db" -mtime +7 | grep -q . && echo "stale"
```

## Common Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Index not found, query failed, or missing API key |
| 127 | chunkhound not in PATH — add `~/.local/bin` |

## Environment Variables

- `OPENAI_API_KEY` — required for embedding generation (index + first-time search)
- `PATH` — must include `~/.local/bin`
```

- [ ] **Step 3: Commit**

```bash
cd /Users/adamnewell/code/personal/github/adamNewell/claude-cloud-architect
git add plugins/archimedes/cookbook/chunkhound/cli.md
git commit -m "docs: add chunkhound CLI cookbook for arch-search scan.sh authors"
```

---

### Task 2: Add write-from-chunkhound to tag-store.ts

This is the direct parallel to `write-from-ast-grep`. scan.sh files pipe `chunkhound search` JSON output to this command via stdin.

**Files:**
- Modify: `tools/tag-store.ts` — add new `write-from-chunkhound` case

- [ ] **Step 1: Read existing write-from-ast-grep implementation** (lines 211–287)

```bash
sed -n '211,287p' plugins/archimedes/tools/tag-store.ts
```

Understand the pattern: reads JSON from stdin, reads rule YAML for archimedes metadata, inserts rows with dedup.

- [ ] **Step 2: Write failing test**

Create `tests/write-from-chunkhound.test.ts`:

```typescript
import { test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";

const tmpDir = mkdtempSync("/tmp/arch-test-");
const dbPath = join(tmpDir, "tags.db");
const sessionId = "test-chunkhound-001";
const ruleFile = join(tmpDir, "test-rule.yaml");
const repoPath = "/test/repo";

// Sample chunkhound output (adjust field names to match actual chunkhound output)
const chunkhoundOutput = JSON.stringify([
  {
    file: "/test/repo/src/db/mongo.ts",
    content: "const client = new MongoClient(uri); await client.connect();",
    score: 0.87
  },
  {
    file: "/test/repo/src/db/events-db.ts",
    content: "const db = client.db('events');",
    score: 0.72
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
  // Re-run should not increase count (dedup on target_ref + kind + source_tool + session_id + source_query)
  expect(result.ok).toBe(true);
  // written = 0 or 2 depending on dedup implementation, but total count in DB stays 2
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
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd plugins/archimedes
bun test tests/write-from-chunkhound.test.ts
```
Expected: FAIL — `write-from-chunkhound` case not yet implemented.

- [ ] **Step 4: Implement write-from-chunkhound in tag-store.ts**

Add after the `write-from-ast-grep` case (line ~287), before `default:`. Adjust field names in `JSON.parse` based on actual chunkhound output discovered in Task 1 Step 1:

```typescript
case "write-from-chunkhound": {
  if (!args.rule) {
    console.error(JSON.stringify({ error: "--rule is required" }));
    process.exit(1);
  }
  if (!args.session) {
    console.error(JSON.stringify({ error: "--session is required" }));
    process.exit(1);
  }

  const dbPath = args.db ?? `.archimedes/sessions/${args.session}/tags.db`;

  // Read archimedes metadata from rule YAML
  const ruleContent = yaml.load(readFileSync(args.rule, "utf-8")) as any;
  const meta = ruleContent.archimedes ?? {};
  const kind = meta.kind ?? "CAPABILITY";
  const confidence = meta.confidence ?? 0.50;
  const targetType = meta.target_type ?? "FILE";

  // Read chunkhound JSON from stdin
  const input = await Bun.stdin.text();
  let matches: any[];
  try {
    matches = JSON.parse(input || "[]");
  } catch (e: any) {
    console.error(JSON.stringify({ error: `Invalid JSON on stdin: ${e.message}` }));
    process.exit(1);
  }

  const db = openDb(dbPath);
  const stmt = db.prepare(`
    INSERT INTO tags
      (id, target_type, target_ref, target_repo, kind, value, confidence,
       weight_class, source_tool, source_query, source_evidence,
       status, session_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(target_ref, kind, source_tool, session_id, source_query)
    DO UPDATE SET updated_at = excluded.updated_at,
                  confidence = MAX(confidence, excluded.confidence)
    RETURNING id
  `);

  const now = new Date().toISOString();
  const ids: string[] = [];

  try {
    for (const match of matches) {
      // chunkhound output fields: file (abs path), content (snippet), score
      // Strip repo prefix from file path to get relative target_ref
      const targetRepo = args["target-repo"] ?? "";
      const absFile: string = match.file ?? "";
      const targetRef = targetRepo && absFile.startsWith(targetRepo)
        ? absFile.slice(targetRepo.length).replace(/^\//, "")
        : absFile;
      const snippet: string = (match.content ?? match.snippet ?? "").slice(0, 500);

      const value = JSON.stringify({
        subkind: meta.subkind,
        rule_id: ruleContent.id,
        score: match.score,
      });

      const row = stmt.get(
        crypto.randomUUID(), targetType, targetRef,
        targetRepo, kind, value, confidence,
        "MACHINE", "chunkhound",
        ruleContent.id, snippet,
        "CANDIDATE", args.session, now, now
      ) as any;
      ids.push(row.id);
    }
    db.close();
    console.log(JSON.stringify({ ok: true, written: ids.length, ids }));
  } catch (e: any) {
    db.close();
    console.error(JSON.stringify({ error: e.message }));
    process.exit(1);
  }
  break;
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
bun test tests/write-from-chunkhound.test.ts
```
Expected: 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add plugins/archimedes/tools/tag-store.ts plugins/archimedes/tests/write-from-chunkhound.test.ts
git commit -m "feat: add write-from-chunkhound command to tag-store.ts"
```

---

### Task 3: Query Pack Registry

**Files:**
- Create: `queries/_registry.yaml`

- [ ] **Step 1: Verify patterns/_registry.yaml structure**

```bash
cat plugins/archimedes/patterns/_registry.yaml
```

- [ ] **Step 2: Write registry mirroring the structure**

Create `plugins/archimedes/queries/_registry.yaml`:

```yaml
# Query pack registry — parallel to patterns/_registry.yaml
# Each entry enables a semantic search pack.
# Packs are loaded by run-semantic-scan.sh; unknown pack names are silently skipped.

packs:
  - id: core
    description: "General TypeScript/Node.js: Sequelize models, LIVR validation, chista services, Poller tasks, Express routes, Repository/Service classes"
    path: queries/core

  - id: aws-serverless
    description: "AWS Lambda patterns: MongoDB multi-db, Athena CTE builders, Redshift COPY loaders, Kinesis Firehose, score calculators, storage routers, Secrets Manager"
    path: queries/aws-serverless

  - id: delos-platform
    description: "Delos NVA ecosystem: executeNVA commands, CoreChannel/PluginChannel, Darwin Capability definitions, DevicesNVARepo, Watcher triggers"
    path: queries/delos-platform

  - id: iot-core
    description: "IoT/Edge: LwM2M event decoders, OpenThread border router, Greengrass component patterns, device snapshot pipelines, cellular connection management"
    path: queries/iot-core
```

- [ ] **Step 3: Commit**

```bash
git add plugins/archimedes/queries/_registry.yaml
git commit -m "feat: add queries/_registry.yaml for semantic query packs"
```

---

## Chunk 2: Query Packs

> **Scan.sh template** (all four packs use this identical pattern — copy verbatim):
>
> ```bash
> #!/bin/bash
> # semantic query pack scanner
> # Usage: bash queries/<pack>/scan.sh <repo-path> <session-id> <db-path>
> set -e
>
> REPO=$1; SESSION=$2; DB_PATH=$3
> PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
> PLUGIN_ROOT="$(dirname "$(dirname "$PACK_DIR")")"
>
> if [ -z "$REPO" ] || [ -z "$SESSION" ] || [ -z "$DB_PATH" ]; then
>   echo '{"error":"Usage: scan.sh <repo> <session> <db-path>"}' >&2
>   exit 1
> fi
>
> # Ensure chunkhound is in PATH
> export PATH="$HOME/.local/bin:$PATH"
>
> INDEX_DB="$REPO/.archimedes/index/chunkhound.db"
>
> # Build index if missing or stale (>7 days)
> if [ ! -f "$INDEX_DB" ] || find "$REPO/.archimedes/index/" -name "chunkhound.db" -mtime +7 2>/dev/null | grep -q .; then
>   mkdir -p "$REPO/.archimedes/index"
>   echo "[arch-search] Building chunkhound index for $REPO..." >&2
>   chunkhound index "$REPO" --db "$INDEX_DB"
> fi
>
> TAG_COUNT=0
>
> for rule in "$PACK_DIR/rules"/*.yaml; do
>   [ -f "$rule" ] || continue
>   rule_name=$(basename "$rule" .yaml)
>
>   query=$(yq '.query' "$rule")
>   top_k=$(yq '.top_k' "$rule")
>
>   written=$(chunkhound search "$query" "$REPO" \
>     --db "$INDEX_DB" \
>     --semantic \
>     --page-size "$top_k" 2>/dev/null \
>   | bun "$PLUGIN_ROOT/tools/tag-store.ts" write-from-chunkhound \
>       --session "$SESSION" \
>       --db "$DB_PATH" \
>       --rule "$rule" \
>       --target-repo "$REPO" \
>   | jq -r '.written // 0')
>
>   TAG_COUNT=$((TAG_COUNT + written))
>   [ "$written" -gt 0 ] && echo "  [$rule_name] $written tags" >&2
> done
>
> echo "{\"ok\":true,\"pack\":\"$(basename $PACK_DIR)\",\"tags_written\":$TAG_COUNT}"
> ```

### Task 4: core Query Pack

**Files:**
- Create: `queries/core/pack.yaml`
- Create: `queries/core/scan.sh`
- Create: `queries/core/rules/sequelize-model.yaml`
- Create: `queries/core/rules/livr-validation.yaml`
- Create: `queries/core/rules/chista-service.yaml`
- Create: `queries/core/rules/poller-pattern.yaml`
- Create: `queries/core/rules/express-route.yaml`
- Create: `queries/core/rules/repository-class.yaml`
- Create: `queries/core/rules/service-class.yaml`
- Create: `queries/core/rules/event-handler.yaml`
- Create: `queries/core/rules/http-client.yaml`
- Create: `queries/core/rules/config-loader.yaml`

- [ ] **Step 1: Write pack.yaml**

```yaml
id: core
description: "General TypeScript/Node.js patterns: Sequelize models, LIVR validation, chista services, Poller background tasks, Express routes, Repository/Service classes"
languages: [typescript, javascript, python]
```

- [ ] **Step 2: Write the 10 rule YAMLs**

`queries/core/rules/sequelize-model.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: sequelize-model
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: sequelize-model-definition
query: "Sequelize model definition with DataTypes associations belongsTo hasMany"
top_k: 10
```

`queries/core/rules/livr-validation.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: livr-validation
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: livr-validation-schema
query: "LIVR validation schema rules required string integer nested object"
top_k: 8
```

`queries/core/rules/chista-service.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: chista-service
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: chista-service-pattern
query: "chista service validate execute interactor action run command handler"
top_k: 10
```

`queries/core/rules/poller-pattern.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: poller-background-task
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: poller-background-task
query: "background polling task setInterval setTimeout recurring periodic job worker"
top_k: 6
```

`queries/core/rules/express-route.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: express-route
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: express-route-handler
query: "Express router get post put delete middleware route handler request response"
top_k: 10
```

`queries/core/rules/repository-class.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: repository-class
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: repository-class-pattern
query: "repository class findById findAll create update delete database abstraction"
top_k: 8
```

`queries/core/rules/service-class.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: service-class
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: service-class-pattern
query: "service class business logic orchestration domain operation"
top_k: 8
```

`queries/core/rules/event-handler.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: event-handler
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: event-handler-pattern
query: "event emitter on emit listener subscribe publish handler callback"
top_k: 6
```

`queries/core/rules/http-client.yaml`:
```yaml
archimedes:
  kind: DEPENDENCY
  subkind: http-client
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: http-client-usage
query: "HTTP client axios fetch request GET POST API external service call"
top_k: 6
```

`queries/core/rules/config-loader.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: config-loader
  confidence: 0.45
  weight_class: MACHINE
  target_type: FILE
id: config-loader-pattern
query: "configuration loader environment variables process.env dotenv settings"
top_k: 5
```

- [ ] **Step 3: Write scan.sh** (copy template from Chunk 2 header verbatim)

```bash
# Copy template exactly — only the echo at the end changes "pack_name"
chmod +x plugins/archimedes/queries/core/scan.sh
```

- [ ] **Step 4: Smoke test scan.sh against wcdp**

```bash
REPO="/Users/adamnewell/code/work/Delos-tech/cloud/wellcube-device-data-processing"
SESSION="wcdp-phase2-test"
DB_PATH="$REPO/.archimedes/sessions/$SESSION/tags.db"
mkdir -p "$REPO/.archimedes/sessions/$SESSION"
bun plugins/archimedes/tools/tag-store.ts init --session "$SESSION" --db "$DB_PATH"
bash plugins/archimedes/queries/core/scan.sh "$REPO" "$SESSION" "$DB_PATH"
bun plugins/archimedes/tools/tag-store.ts query \
  --session "$SESSION" --db "$DB_PATH" \
  --sql "SELECT COUNT(*) as total FROM tags WHERE session_id='$SESSION'"
```

Expected: total > 0 (even a small number validates the pipeline end-to-end).

- [ ] **Step 5: Commit**

```bash
git add plugins/archimedes/queries/core/
git commit -m "feat: add core query pack (10 rules: sequelize, livr, chista, poller, express, repository, service, event, http-client, config)"
```

---

### Task 5: aws-serverless Query Pack

**Files:**
- Create: `queries/aws-serverless/pack.yaml`
- Create: `queries/aws-serverless/scan.sh`
- Create: `queries/aws-serverless/rules/` (10 rules)

- [ ] **Step 1: Write pack.yaml**

```yaml
id: aws-serverless
description: "AWS Lambda patterns: MongoDB multi-db clients, Athena CTE builders, Redshift COPY loaders, Kinesis Firehose transforms, score calculators, multi-tier storage routers, Secrets Manager injection"
languages: [typescript, javascript, python]
```

- [ ] **Step 2: Write the 10 rule YAMLs**

`rules/mongodb-client.yaml`:
```yaml
archimedes:
  kind: DEPENDENCY
  subkind: mongodb-client
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: mongodb-client-usage
query: "MongoDB database client connection collection operations MongoClient connect"
top_k: 8
```

`rules/mongodb-multi-db.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: mongodb-multi-db
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: mongodb-multi-db-pattern
query: "MongoDB multiple databases events-db historical-db snapshots-meta db connection pool"
top_k: 5
```

`rules/athena-cte-builder.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: athena-cte-builder
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: athena-cte-query-builder
query: "Athena CTE common table expression query builder aggregation time series metrics"
top_k: 5
```

`rules/redshift-copy-loader.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: redshift-copy-loader
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: redshift-copy-manifest
query: "Redshift COPY command manifest loader S3 data warehouse bulk insert"
top_k: 5
```

`rules/firehose-transform.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: kinesis-firehose-transform
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: firehose-transformation-function
query: "Kinesis Firehose transformation function record processing base64 encode decode"
top_k: 5
```

`rules/score-calculator.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: score-calculator
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: score-calculator
query: "score calculator DAQI ITC IVC comfort IEQ air quality index compute"
top_k: 6
```

`rules/storage-router.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: storage-router
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: multi-tier-storage-router
query: "storage router Athena Redshift time resolution PT1M PT1H tier selection query routing"
top_k: 5
```

`rules/secrets-injection.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: secrets-injection
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: secrets-manager-lambda-init
query: "Secrets Manager getSecretValue Lambda initialization secrets injection environment"
top_k: 6
```

`rules/lambda-powertools.yaml`:
```yaml
archimedes:
  kind: DEPENDENCY
  subkind: lambda-powertools
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: aws-lambda-powertools
query: "AWS Lambda Powertools logger tracer metrics middleware decorator"
top_k: 6
```

`rules/dynamodb-query-pattern.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: dynamodb-query-pattern
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: dynamodb-gsi-query
query: "DynamoDB query GSI global secondary index key condition expression filter"
top_k: 6
```

- [ ] **Step 3: Write scan.sh** (copy template, chmod +x)

- [ ] **Step 4: Commit**

```bash
git add plugins/archimedes/queries/aws-serverless/
git commit -m "feat: add aws-serverless query pack (10 rules: mongodb, athena, redshift, firehose, score, storage-router, secrets, powertools, dynamodb)"
```

---

### Task 6: delos-platform Query Pack

**Files:**
- Create: `queries/delos-platform/pack.yaml`
- Create: `queries/delos-platform/scan.sh`
- Create: `queries/delos-platform/rules/` (7 rules)

- [ ] **Step 1: Write pack.yaml**

```yaml
id: delos-platform
description: "Delos NVA ecosystem: executeNVA commands, CoreChannel/PluginChannel clients, Darwin Capability definitions, DevicesNVARepo device management, Watcher reactive triggers"
languages: [typescript, javascript]
```

- [ ] **Step 2: Write the 7 rule YAMLs**

`rules/nva-executor.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: nva-executor
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: nva-executor-pattern
query: "executeNVA executeAndShiftNVA executeNVAInBatches NVA command execution batch processing"
top_k: 8
```

`rules/corechannel-client.yaml`:
```yaml
archimedes:
  kind: DEPENDENCY
  subkind: corechannel-client
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: corechannel-client
query: "CoreChannel client connection MQTT channel subscribe publish Darwin platform"
top_k: 5
```

`rules/pluginchannel-router.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: pluginchannel-router
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: pluginchannel-event-router
query: "PluginChannel event router wildcard pattern topic routing subscription handler"
top_k: 5
```

`rules/capability-definition.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: capability-definition
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: darwin-capability-definition
query: "Darwin Capability definition class thing property action NVA schema"
top_k: 6
```

`rules/devices-nva-repo.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: devices-nva-repo
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: translator-devices-nva-repo
query: "DevicesNVARepo Translator createDevice updateDevice device management repository"
top_k: 5
```

`rules/watcher-trigger.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: watcher-trigger
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: watcher-reactive-trigger
query: "Watcher reactive trigger definition condition action event-driven automation"
top_k: 5
```

`rules/nva-parse-match.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: nva-parse-match
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: nva-parse-match-pipeline
query: "NVA parse match pipeline noun verb adverb pattern matching translation"
top_k: 5
```

- [ ] **Step 3: Write scan.sh** (copy template, chmod +x)

- [ ] **Step 4: Commit**

```bash
git add plugins/archimedes/queries/delos-platform/
git commit -m "feat: add delos-platform query pack (7 rules: nva-executor, corechannel, pluginchannel, capability, devices-repo, watcher, nva-parse)"
```

---

### Task 7: iot-core Query Pack

**Files:**
- Create: `queries/iot-core/pack.yaml`
- Create: `queries/iot-core/scan.sh`
- Create: `queries/iot-core/rules/` (6 rules)

- [ ] **Step 1: Write pack.yaml**

```yaml
id: iot-core
description: "IoT and embedded patterns: LwM2M event decoders, OpenThread border router, Greengrass component deployment, device snapshot pipelines, cellular connection management"
languages: [typescript, javascript, python]
```

- [ ] **Step 2: Write the 6 rule YAMLs**

`rules/lwm2m-decoder.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: lwm2m-decoder
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: lwm2m-event-decoder
query: "LwM2M event decoder lwm2m_events.json object resource mapping protocol"
top_k: 5
```

`rules/otbr-integration.yaml`:
```yaml
archimedes:
  kind: DEPENDENCY
  subkind: otbr-integration
  confidence: 0.45
  weight_class: MACHINE
  target_type: FILE
id: openthread-border-router
query: "OpenThread border router OTBR Thread network integration mesh connectivity"
top_k: 5
```

`rules/greengrass-component.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: greengrass-component-deployment
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: greengrass-deployment-pattern
query: "AWS Greengrass component deployment recipe lifecycle install run configuration"
top_k: 5
```

`rules/device-snapshot.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: device-snapshot-pipeline
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: device-snapshot-pipeline
query: "device snapshot pipeline state capture periodic sync shadow update orchestration"
top_k: 6
```

`rules/cellular-management.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: cellular-management
  confidence: 0.45
  weight_class: MACHINE
  target_type: FILE
id: cellular-connection-management
query: "cellular connection management ModemManager NetworkManager LTE 4G modem control"
top_k: 5
```

`rules/mqtt-device-shadow.yaml`:
```yaml
archimedes:
  kind: PATTERN
  subkind: mqtt-device-shadow
  confidence: 0.50
  weight_class: MACHINE
  target_type: FILE
id: iot-device-shadow
query: "IoT device shadow state reported desired delta update MQTT AWS Shadow"
top_k: 5
```

- [ ] **Step 3: Write scan.sh** (copy template, chmod +x)

- [ ] **Step 4: Commit**

```bash
git add plugins/archimedes/queries/iot-core/
git commit -m "feat: add iot-core query pack (6 rules: lwm2m, otbr, greengrass, device-snapshot, cellular, mqtt-shadow)"
```

---

## Chunk 3: Orchestrator

### Task 8: run-semantic-scan.sh

**Files:**
- Create: `tools/run-semantic-scan.sh`

- [ ] **Step 1: Write run-semantic-scan.sh mirroring run-structure-scan.sh**

```bash
#!/bin/bash
# Semantic scan orchestrator for Archimedes Tier 2.
# Mirrors tools/scripts/run-structure-scan.sh interface exactly.
#
# Usage: bash tools/run-semantic-scan.sh <repo> <session> <db-path> [packs]
#
# Arguments (positional, order-sensitive):
#   repo      — Absolute path to service root (not monorepo root)
#   session   — Session ID (must match an initialized session)
#   db-path   — Absolute path to tags.db
#   packs     — Comma-separated: "core,aws-serverless,delos-platform,iot-core"
#
# Gate: produces ≥10 CANDIDATE tags on wellcube-device-data-processing
set -e

REPO=$1; SESSION=$2; DB_PATH=$3
PACKS=${4:-"core"}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"

# Ensure chunkhound is findable
export PATH="$HOME/.local/bin:$PATH"

echo "{\"scan_start\":true,\"repo\":\"$REPO\",\"packs\":\"$PACKS\",\"tier\":\"semantic\"}" >&2

for pack in $(echo "$PACKS" | tr ',' '\n'); do
  SCAN_SH="$PLUGIN_ROOT/queries/$pack/scan.sh"
  if [ -f "$SCAN_SH" ]; then
    echo "Running semantic pack: $pack" >&2
    bash "$SCAN_SH" "$REPO" "$SESSION" "$DB_PATH"
  else
    echo "{\"warning\":\"Semantic pack '$pack' not found at $SCAN_SH\"}" >&2
  fi
done

echo "{\"ok\":true,\"repo\":\"$REPO\",\"session\":\"$SESSION\",\"tier\":\"semantic\"}"
```

- [ ] **Step 2: Make executable**

```bash
chmod +x plugins/archimedes/tools/run-semantic-scan.sh
```

- [ ] **Step 3: End-to-end smoke test**

```bash
REPO="/Users/adamnewell/code/work/Delos-tech/cloud/wellcube-device-data-processing"
SESSION="wcdp-phase2-smoke"
DB_PATH="$REPO/.archimedes/sessions/$SESSION/tags.db"

# Initialize fresh session
bun plugins/archimedes/tools/session-init.ts \
  --session "$SESSION" \
  --repo "$REPO" \
  --packs "core,aws-serverless,iot-core"

# Run orchestrator
bash plugins/archimedes/tools/run-semantic-scan.sh \
  "$REPO" "$SESSION" "$DB_PATH" "core,aws-serverless,iot-core"

# Count CANDIDATE tags
bun plugins/archimedes/tools/tag-store.ts query \
  --session "$SESSION" --db "$DB_PATH" \
  --sql "SELECT COUNT(*) as candidates FROM tags WHERE session_id='$SESSION' AND weight_class='MACHINE' AND status='CANDIDATE'"
```

Expected: candidates > 0. (Full gate of ≥10 is validated in Task 13.)

- [ ] **Step 4: Commit**

```bash
git add plugins/archimedes/tools/run-semantic-scan.sh
git commit -m "feat: add run-semantic-scan.sh orchestrator (semantic Tier 2, mirrors run-structure-scan.sh)"
```

---

## Chunk 4: Skills

### Task 9: arch-search SKILL.md

> Must score ≥115/120 on skill-judge before Phase 2 is complete.
> Expect 6-10 skill-judge iteration loops (same as arch-tags and arch-structure in Phase 1).

**Files:**
- Create: `skills/arch-search/SKILL.md`

- [ ] **Step 1: Write first draft**

Create `plugins/archimedes/skills/arch-search/SKILL.md`:

```markdown
---
name: arch-search
description: Semantic code search using chunkhound vector embeddings. Runs query packs against a repository and writes CAPABILITY and DEPENDENCY CANDIDATE tags (weight_class MACHINE, status CANDIDATE) to the tag store — no LLM in the write path. Use when: finding code patterns ast-grep can't match (business logic, domain concepts, NVA commands, score calculators, multi-db routing), discovering undocumented integration points, or adding semantic coverage after arch-structure for the same session. Keywords: semantic search, vector search, chunkhound, CANDIDATE tags, capability discovery, business logic, NVA patterns, MongoDB client, score calculator.
---
# arch-search

Run semantic query packs against a repository. CANDIDATE tags are written by scripts, not agents — the search is chunkhound embedding similarity, not LLM inference.

**Core principle:** The write path is entirely script-driven. Agents analyze what scripts found. Agents never call chunkhound directly or write MACHINE tags manually. CANDIDATE tags are probabilistic — always use the promotion workflow before treating findings as architectural fact.

## Usage

```bash
bash tools/run-semantic-scan.sh \
  <repo_path> \
  <session_id> \
  <db_path> \
  "<comma-separated-packs>"
```

Arguments are positional and order-sensitive, identical to `run-structure-scan.sh`. `repo_path` must be absolute, pointing to the **service root** (not a subdirectory, not a monorepo root).

## Which Packs to Use

**MANDATORY: READ ENTIRE FILE `references/pack-selection-guide.md`** before choosing packs for a session on a new or unfamiliar repository. Semantic pack selection mirrors structural pack selection.

Quick reference:
- Pure TypeScript/Node.js service → `core`
- AWS Lambda + DynamoDB → `core,aws-serverless`
- Delos Darwin/NVA service → `core,aws-serverless,delos-platform`
- IoT/Edge service → `core,iot-core`

When uncertain: start with `core`. Add packs based on what arch-structure's PATTERN tags reveal about the stack.

## Pre-flight: $SESSION, $REPO, $DB_PATH

Semantic scan **appends to the same session** as the structure scan — do NOT initialize a new session. Resolve $DB_PATH from the existing session's meta.json:

```bash
DB_PATH=$(cat $REPO/.archimedes/sessions/$SESSION/meta.json | jq -r .db_path)
```

## Index Lifecycle

The chunkhound index persists at `$REPO/.archimedes/index/chunkhound.db` (DuckDB format). `run-semantic-scan.sh` builds it automatically on first run and rebuilds if missing or older than 7 days. Building requires `OPENAI_API_KEY` (for text-embedding-3-small). Do not rebuild manually — the orchestrator manages this.

## Post-Scan Analysis

**MANDATORY before writing any SQL beyond the scope-check queries: READ ENTIRE FILE `cookbook/tag-store/queries.md`** (22 ready-to-use templates).

**Step 1 — Scope check (CANDIDATE tags):**
```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT kind, COUNT(*) as count FROM tags WHERE target_repo='$REPO' AND session_id='$SESSION' AND weight_class='MACHINE' AND status='CANDIDATE' GROUP BY kind"
```
What to look for: CANDIDATE count < 5 on a non-trivial service = likely index build failure or missing API key.

**Step 2 — New patterns not found by ast-grep:**
```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT DISTINCT json_extract(value,'$.subkind') as subkind, target_ref FROM tags WHERE target_repo='$REPO' AND session_id='$SESSION' AND weight_class='MACHINE' AND status='CANDIDATE' ORDER BY subkind"
```
What to look for: Subkinds absent from VALIDATED PATTERN tags — semantic-only discoveries are the highest-value findings.

**Step 3 — Promote or reject candidates:**
```bash
# Promote a validated finding
bun tools/tag-store.ts promote --id <uuid> --validated-by "Adam" --session $SESSION

# Reject a false positive
bun tools/tag-store.ts reject --id <uuid> --session $SESSION
```

## Confirming Scan Completeness

```bash
# 1. Verify index built
ls $REPO/.archimedes/index/chunkhound.db

# 2. Count CANDIDATE tags
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT COUNT(*) as total FROM tags WHERE session_id='$SESSION' AND weight_class='MACHINE'"
```

If total is 0, diagnose in order:
1. `chunkhound --version` — if not found: `export PATH="$HOME/.local/bin:$PATH"`
2. Confirm `OPENAI_API_KEY` is set (required for embedding)
3. Test directly: `chunkhound search "MongoDB client" $REPO --db $REPO/.archimedes/index/chunkhound.db --semantic --page-size 3`
4. Check if index was built: rebuild manually with `chunkhound index $REPO --db $REPO/.archimedes/index/chunkhound.db`

## Query Packs

| Pack | Coverage |
|---|---|
| core | Sequelize models, LIVR validation, chista services, Poller background tasks, Express routes, Repository/Service classes |
| aws-serverless | MongoDB multi-db clients (events-db, historical-db, snapshots-meta), Athena CTE builders, Redshift COPY loaders, Kinesis Firehose transforms, score calculators (DAQI/ITC/IVC/comfort/IEQ), multi-tier storage routers, Secrets Manager injection |
| delos-platform | NVA executor patterns (executeNVA, executeAndShiftNVA, executeNVAInBatches), CoreChannel/PluginChannel clients, Darwin Capability definitions, DevicesNVARepo, Watcher triggers, NVA parse+match pipeline |
| iot-core | LwM2M event decoders, OTBR integration, Greengrass component patterns, device snapshot pipelines, cellular connection management |

## Guardrails

- **Never invoke `chunkhound` directly as a scanner** — always use `run-semantic-scan.sh`. Direct invocation bypasses session tracking, tag deduplication, and source_evidence normalization.
- **Never write MACHINE tags manually** — manually written MACHINE tags lack source_query and source_evidence metadata required by the promotion workflow.
- **Never promote CANDIDATE tags without reading source_evidence** — semantic similarity can surface plausible but contextually incorrect matches. Always verify the snippet before promoting.
- **Never treat 0 CANDIDATE tags as "no semantic patterns"** — it means either the index wasn't built or OPENAI_API_KEY was missing. Diagnose before concluding.
- **Never scan a subdirectory** — target_ref paths are recorded relative to scan root. Subdirectory scans produce broken cross-references with structure scan tags.
- **Never run semantic scan in a different session than the structure scan** — cross-tier correlation queries require shared session_id.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `chunkhound: command not found` | Not in PATH | `export PATH="$HOME/.local/bin:$PATH"` |
| 0 CANDIDATE tags | Index not built or OPENAI_API_KEY missing | Verify `ls $REPO/.archimedes/index/chunkhound.db`; rebuild if absent |
| CANDIDATE count unexpectedly low | query too specific or top_k too small | Increase top_k in rule YAML; broaden query text |
| Same file tagged 10+ times | Multiple overlapping rules match the same file | Normal for hub files (e.g., db-client.ts); review top hits manually |
| Index rebuilds on every run | mtime check condition failing | Run `find $REPO/.archimedes/index/ -name "chunkhound.db" -mtime +7` manually to verify |
| `OPENAI_API_KEY` error during index | Embedding API key not set | `export OPENAI_API_KEY=<key>` before running |
```

- [ ] **Step 2: Run skill-judge**

```
/skill-judge plugins/archimedes/skills/arch-search/SKILL.md
```

- [ ] **Step 3: Fix issues until ≥115/120**

Iterate: read skill-judge report → fix SKILL.md → re-run → repeat until score ≥115/120.
Expect 6-10 iterations (historical baseline from Phase 1: arch-tags took 8 loops, arch-structure took 7).

- [ ] **Step 4: Commit**

```bash
git add plugins/archimedes/skills/arch-search/SKILL.md
git commit -m "feat: add arch-search skill (chunkhound semantic scan, query packs, ≥115/120 skill-judge)"
```

---

### Task 10: search-agent.md

**Files:**
- Create: `agents/search-agent.md`

- [ ] **Step 1: Read structure-agent.md to match the agent file convention**

```bash
cat plugins/archimedes/agents/structure-agent.md
```

- [ ] **Step 2: Write search-agent.md**

Create `plugins/archimedes/agents/search-agent.md`:

```markdown
---
name: archimedes-search-agent
description: Semantic architecture search agent for Archimedes. Runs arch-search on a repository and synthesizes CANDIDATE tags into architectural insights. Invoked by arch-map-service after arch-structure completes.
---
# Archimedes Search Agent

You are the Archimedes semantic search agent. Your role is to run arch-search, review CANDIDATE findings, and surface patterns that ast-grep couldn't find.

## Your Task

1. Invoke `arch-search` skill: run `bash tools/run-semantic-scan.sh $REPO $SESSION $DB_PATH "$PACKS"`
2. Run Step 1 scope check query from arch-search SKILL.md
3. Run Step 2 subkind discovery query from arch-search SKILL.md
4. Cross-reference with VALIDATED PATTERN tags from structure scan: which subkinds appear in CANDIDATE but not VALIDATED?
5. Identify the top 5 CANDIDATE findings by count (subkind with most matching files)
6. Report structured summary (see below)

## What You Report

```
SEMANTIC PATTERNS DISCOVERED (not in ast-grep VALIDATED tags):
- [subkind]: [count] file matches | Representative: [target_ref]
  Evidence: [1-2 sentences from source_evidence snippets]

CANDIDATES FOR PROMOTION (strong semantic matches):
- [uuid]: [target_ref] | [subkind] | Evidence: [snippet excerpt]

POSSIBLE FALSE POSITIVES:
- [uuid]: [target_ref] | [subkind] | Reason: [why it might be wrong]

COVERAGE GAPS (query packs with 0 or very few matches):
- [pack/subkind]: 0 matches — likely gap or service doesn't use this pattern
```

## Guardrails

- Never write tags manually — only through `run-semantic-scan.sh`
- Never promote tags without reading source_evidence first
- Never declare "no semantic patterns" if CANDIDATE count is 0 — diagnose first (see arch-search Confirming Scan Completeness section)
- Never run semantic scan in a different session than the structure scan
```

- [ ] **Step 3: Commit**

```bash
git add plugins/archimedes/agents/search-agent.md
git commit -m "feat: add search-agent.md for Archimedes semantic architecture discovery"
```

---

### Task 11: arch-map-service SKILL.md

> Must score ≥115/120 on skill-judge before Phase 2 is complete.

**Files:**
- Create: `skills/arch-map-service/SKILL.md`

- [ ] **Step 1: Write first draft**

Create `plugins/archimedes/skills/arch-map-service/SKILL.md`:

```markdown
---
name: arch-map-service
description: Full Archimedes two-tier pipeline for a single service. Runs arch-structure (Tier 1 ast-grep) then arch-search (Tier 2 chunkhound) in the same session, then synthesizes findings into a unified architecture map. Use when you need a complete picture of a service's patterns, dependencies, capabilities, and technical debt. Keywords: map service, architecture analysis, full scan, structure plus semantic, service map, Archimedes pipeline, complete analysis.
---
# arch-map-service

Run the complete two-tier Archimedes pipeline against a single service and synthesize a unified architecture map.

**Two-tier pipeline:**
- Tier 1 (`arch-structure`, ast-grep): writes PATTERN + DEPENDENCY + DEBT tags with `HUMAN` weight, `VALIDATED` status — deterministic, zero hallucination
- Tier 2 (`arch-search`, chunkhound): writes CAPABILITY + DEPENDENCY tags with `MACHINE` weight, `CANDIDATE` status — probabilistic, requires human promotion

Both tiers run in the **same session**. Cross-tier correlation is only possible with a shared session_id.

## Usage

Run in order. Never swap tiers. Never use separate sessions.

```bash
# 1. Initialize session
DB_PATH=$(bun tools/session-init.ts --session $SESSION --repo $REPO --packs "core,aws-serverless" \
  | jq -r .db_path)

# 2. Tier 1: structural scan (MANDATORY FIRST)
bash tools/scripts/run-structure-scan.sh $REPO $SESSION $DB_PATH "core,aws-serverless"

# 3. Tier 2: semantic scan (appends to same session)
bash tools/run-semantic-scan.sh $REPO $SESSION $DB_PATH "core,aws-serverless"
```

## Which Packs

Use identical packs for both tiers. Pattern packs and query packs are parallel:

| Pattern pack | Query pack | Coverage |
|---|---|---|
| `core` | `core` | General TypeScript patterns |
| `aws-serverless` | `aws-serverless` | Lambda + AWS services |
| `iot-core` | `iot-core` | IoT / MQTT / Greengrass |
| _(N/A in patterns)_ | `delos-platform` | Delos NVA ecosystem |

For pack selection: **READ `references/pack-selection-guide.md`** (arch-structure requirement applies to arch-map-service equally).

## Post-Map Analysis

After both tiers complete, run these three queries to produce the architecture map:

**1. Full tag inventory (combined tiers):**
```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT kind, weight_class, status, COUNT(*) as count FROM tags WHERE target_repo='$REPO' AND session_id='$SESSION' GROUP BY kind, weight_class, status ORDER BY count DESC"
```

**2. Semantic-only discoveries (MACHINE CANDIDATE files not in any VALIDATED tag):**
```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT DISTINCT t1.target_ref, json_extract(t1.value,'$.subkind') as subkind FROM tags t1 WHERE t1.session_id='$SESSION' AND t1.weight_class='MACHINE' AND t1.status='CANDIDATE' AND NOT EXISTS (SELECT 1 FROM tags t2 WHERE t2.session_id='$SESSION' AND t2.target_ref=t1.target_ref AND t2.weight_class='HUMAN') ORDER BY subkind"
```
These are files with semantic patterns but no structural tags — undocumented integration points.

**3. Debt summary:**
```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT target_ref, json_extract(value,'$.subkind') as issue, confidence FROM tags WHERE target_repo='$REPO' AND session_id='$SESSION' AND kind='DEBT' AND status NOT IN ('REJECTED') ORDER BY confidence DESC"
```

## Interpreting the Combined Map

| Finding | What It Means |
|---|---|
| VALIDATED PATTERN + CANDIDATE CAPABILITY on same file | High confidence — both tiers agree this is a key component |
| CANDIDATE with no VALIDATED on same file | Semantic-only discovery — check if pattern pack gap or dynamic dispatch |
| DEBT + PATTERN in same file | Highest refactoring risk — working code with known technical debt |
| MACHINE CANDIDATE but 0 VALIDATED in entire service | Likely ast-grep pack gap — review `patterns/_registry.yaml` |
| DEBT > 20% of PATTERN count | Systemic debt, not isolated issues — flag for remediation sprint |

## Guardrails

- **Never run arch-search before arch-structure** — cross-tier correlation (Query 2 above) relies on VALIDATED tags existing first. Running semantic-only produces CANDIDATE tags with nothing to correlate against.
- **Never use separate sessions for Tier 1 and Tier 2** — shared session_id is required for the semantic-only discovery query. Separate sessions make cross-tier queries impossible.
- **Never treat CANDIDATE as confirmed architectural fact** — use the promotion workflow (`bun tools/tag-store.ts promote`) before including MACHINE findings in deliverables.
- **Never scan a monorepo root** — same constraint as arch-structure: scan service roots individually. Mixed-service sessions produce unfilterable findings.
- **Never skip the full tag inventory query** — it's the only way to detect pack coverage gaps across both tiers simultaneously.
```

- [ ] **Step 2: Run skill-judge**

```
/skill-judge plugins/archimedes/skills/arch-map-service/SKILL.md
```

- [ ] **Step 3: Fix until ≥115/120**

- [ ] **Step 4: Commit**

```bash
git add plugins/archimedes/skills/arch-map-service/SKILL.md
git commit -m "feat: add arch-map-service skill (full two-tier pipeline: structure + semantic, ≥115/120 skill-judge)"
```

---

## Chunk 5: Phase 2 Validation Gate

### Task 12: Run Full Pipeline on wellcube-device-data-processing

**Phase 2 Gate:** Semantic scan on `wellcube-device-data-processing` must produce ≥10 CANDIDATE tags with `weight_class='MACHINE'`.

- [ ] **Step 1: Initialize fresh combined session**

```bash
REPO="/Users/adamnewell/code/work/Delos-tech/cloud/wellcube-device-data-processing"
SESSION="wcdp-20260224"

DB_PATH=$(bun plugins/archimedes/tools/session-init.ts \
  --session "$SESSION" \
  --repo "$REPO" \
  --packs "core,aws-serverless,iot-core" \
  | jq -r .db_path)

echo "DB_PATH: $DB_PATH"
```

- [ ] **Step 2: Tier 1 — structure scan**

```bash
bash plugins/archimedes/tools/scripts/run-structure-scan.sh \
  "$REPO" "$SESSION" "$DB_PATH" "core,aws-serverless,iot-core"

# Verify Tier 1 baseline (should match Phase 1 results: ≥59 VALIDATED)
bun plugins/archimedes/tools/tag-store.ts query \
  --session "$SESSION" --db "$DB_PATH" \
  --sql "SELECT kind, COUNT(*) FROM tags WHERE session_id='$SESSION' AND weight_class='HUMAN' GROUP BY kind"
```

Expected: PATTERN ≥22 (lambda handlers), DEPENDENCY ≥5 (SQS producers).

- [ ] **Step 3: Tier 2 — semantic scan**

```bash
bash plugins/archimedes/tools/run-semantic-scan.sh \
  "$REPO" "$SESSION" "$DB_PATH" "core,aws-serverless,iot-core"
```

- [ ] **Step 4: Verify Phase 2 gate**

```bash
# Gate check: ≥10 CANDIDATE tags
bun plugins/archimedes/tools/tag-store.ts query \
  --session "$SESSION" --db "$DB_PATH" \
  --sql "SELECT COUNT(*) as candidate_count FROM tags WHERE session_id='$SESSION' AND weight_class='MACHINE' AND status='CANDIDATE'"
```

**Gate passes when `candidate_count >= 10`.**

If gate fails (< 10):
1. Check by pack: `SELECT json_extract(value,'$.subkind'), COUNT(*) FROM tags WHERE weight_class='MACHINE' GROUP BY json_extract(value,'$.subkind')`
2. Verify index was built: `ls $REPO/.archimedes/index/chunkhound.db`
3. Run scan.sh for failing pack with `bash -x` verbose mode
4. Increase `top_k` values in rules that return 0 results

- [ ] **Step 5: Run semantic-only discovery query**

```bash
bun plugins/archimedes/tools/tag-store.ts query \
  --session "$SESSION" --db "$DB_PATH" \
  --sql "SELECT DISTINCT json_extract(value,'$.subkind') as subkind, target_ref FROM tags WHERE session_id='$SESSION' AND weight_class='MACHINE' AND status='CANDIDATE' ORDER BY subkind LIMIT 20"
```

Confirm at least some subkinds are NOT in the VALIDATED PATTERN results (score-calculator, mongodb-client, athena-cte-builder are strong candidates for wellcube-device-data-processing given the MQTT→MongoDB→Athena→Redshift pipeline).

- [ ] **Step 6: Record gate result and commit**

```bash
# Update this plan with actual CANDIDATE count
git add .
git commit -m "feat: Phase 2 gate passes — $CANDIDATE_COUNT CANDIDATE tags on wellcube-device-data-processing"
```

---

## Phase 2 Completion Checklist

- [ ] `write-from-chunkhound` command in tag-store.ts (tests passing)
- [ ] `cookbook/chunkhound/cli.md` written
- [ ] `queries/_registry.yaml` with 4 packs
- [ ] `queries/core/` — 10 rules + scan.sh
- [ ] `queries/aws-serverless/` — 10 rules + scan.sh
- [ ] `queries/delos-platform/` — 7 rules + scan.sh
- [ ] `queries/iot-core/` — 6 rules + scan.sh
- [ ] `tools/run-semantic-scan.sh`
- [ ] `skills/arch-search/SKILL.md` ≥115/120 skill-judge
- [ ] `agents/search-agent.md`
- [ ] `skills/arch-map-service/SKILL.md` ≥115/120 skill-judge
- [ ] **Phase 2 gate**: ≥10 CANDIDATE tags on wellcube-device-data-processing

**Actual gate result:** `98` CANDIDATE tags (82 PATTERN + 16 DEPENDENCY) across 26 distinct subkinds — session `wcdp-20260223` on wellcube-device-data-processing. Gate: PASS ✅
