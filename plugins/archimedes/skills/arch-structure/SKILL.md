---
description: Deterministic structural analysis using ast-grep. Runs pattern packs against a repo and writes PATTERN/DEPENDENCY/DEBT tags directly to the tag store. No LLM in the write path.
---
# arch-structure

## Purpose

Run deterministic pattern matching against a repository using ast-grep. Tags are written by scripts (`scan.sh`), not inferred by agents — zero hallucination risk for fact-gathering.

**Determinism principle:** The write path is script-driven. Agents NEVER call ast-grep directly or write tags manually. The scan orchestrator handles everything.

## Usage

```bash
bash tools/scripts/run-structure-scan.sh \
  <repo_path> \
  <session_id> \
  <db_path> \
  "<comma-separated-packs>"
```

Example:
```bash
bash tools/scripts/run-structure-scan.sh \
  /path/to/my-service \
  abc12345 \
  .archimedes/sessions/abc12345/tags.db \
  "core,aws-serverless,iot-core"
```

## What It Produces

| Tag Kind | Weight | Status | Examples |
|---|---|---|---|
| PATTERN | HUMAN | VALIDATED | Lambda handlers, Express routes, FastAPI endpoints, Repository classes |
| DEPENDENCY | HUMAN | VALIDATED | DynamoDB clients, SQS producers, axios calls, MQTT publishers |
| DEBT | HUMAN | VALIDATED | DynamoDB Scan anti-pattern, MQTT wildcard, hardcoded credentials, GGv2 v1 SDK |

## Querying Results After Scan

```bash
# Summary by kind
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT kind, COUNT(*) as count, ROUND(AVG(confidence),2) as avg_conf FROM tags WHERE target_repo='$REPO' GROUP BY kind"

# Top patterns found
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT json_extract(value,'$.subkind') as subkind, COUNT(*) as count FROM tags WHERE kind='PATTERN' GROUP BY subkind ORDER BY count DESC"

# Debt findings
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT target_ref, json_extract(value,'$.subkind') as issue, json_extract(value,'$.note') as note, confidence FROM tags WHERE kind='DEBT' ORDER BY confidence DESC"
```

## Pattern Packs

Read `patterns/_registry.yaml` for available packs. Session `meta.json` records which packs are enabled.

| Pack | Coverage |
|---|---|
| core | Express/FastAPI routes, axios/requests HTTP clients, EventEmitter, Repository/Service classes, hardcoded secrets |
| aws-serverless | Lambda handlers (ESM/CJS/Python), Powertools, cold-start risk, DynamoDB v3, SQS, SNS, EventBridge, Step Functions |
| iot-core | MQTT connect/subscribe/publish/wildcard, Device Shadow, IoT Rules Engine, Greengrass v2 IPC (pub/sub, IoT Core bridge, config, shadow), GGv2 CFn resources, v1 SDK anti-pattern |

## Adding New Patterns

See `cookbook/ast-grep/patterns.md` for how to write new rule files and add them to a pack.

## Guardrails

- Never call `ast-grep` directly in agent code — always use `run-structure-scan.sh`
- Never write tags manually — only the scan scripts write tags
- If a pack's `scan.sh` fails, the orchestrator logs a warning and continues
- All scan-written tags have `weight_class=HUMAN` and `status=VALIDATED`
