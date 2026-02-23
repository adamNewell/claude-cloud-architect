---
name: arch-structure
description: Deterministic structural pattern analysis using ast-grep. Runs pattern packs against a repository and writes PATTERN, DEPENDENCY, and DEBT tags directly to the tag store — no LLM in the write path. Use when: scanning a repo for architecture patterns, detecting technology stack, finding anti-patterns, discovering infrastructure dependencies, or building the deterministic layer before semantic search. Keywords: scan, structural analysis, pattern detection, detect debt, find dependencies, ast-grep, pattern pack, technology stack.
---
# arch-structure

Run deterministic pattern matching against a repository. Tags are written by scripts, not agents — zero hallucination risk in the fact-gathering step.

**Core principle:** The write path is entirely script-driven. Agents analyze what scripts found. Agents never call ast-grep directly or write structural tags manually. This separation is not a convention — it's what makes the findings trustworthy.

## Usage

```bash
bash tools/scripts/run-structure-scan.sh \
  <repo_path> \
  <session_id> \
  <db_path> \
  "<comma-separated-packs>"
```

## Which Packs to Use

Match packs to what the repository contains. Using unnecessary packs wastes time and produces noisy DEBT findings.

| Repo characteristics | Packs |
|---|---|
| Pure TypeScript/JavaScript or Python service, no cloud | `core` |
| AWS Lambda functions, API Gateway, DynamoDB | `core,aws-serverless` |
| IoT devices, MQTT messaging, AWS IoT Core | `core,aws-serverless,iot-core` |
| Greengrass v2 components or deployment manifests | `core,iot-core` |
| Monorepo with mixed concerns | Run scan once per service subdirectory, not repo root |

**When uncertain:** Start with `core`. Add packs only after reviewing what `core` found. Adding all three packs to a web service produces false-positive IoT DEBT tags.

## What It Produces

| Tag Kind | Weight | Status | Examples |
|---|---|---|---|
| PATTERN | HUMAN | VALIDATED | Lambda handlers, Express routes, FastAPI endpoints, Repository classes |
| DEPENDENCY | HUMAN | VALIDATED | DynamoDB clients, SQS producers, axios calls, MQTT publishers |
| DEBT | HUMAN | VALIDATED | DynamoDB Scan anti-pattern, MQTT wildcard subscription, hardcoded credentials, GGv2 v1 SDK |

## Post-Scan Analysis

After scanning, your role shifts from data collection to interpretation. Run these queries in order — each builds on the previous.

**MANDATORY: Read `cookbook/tag-store/queries.md` before writing custom SQL** (22 ready-to-use templates). Do NOT load `cookbook/ast-grep/patterns.md` unless adding new pattern rules.

**Step 1 — Scope check:**
```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT kind, COUNT(*) as count, ROUND(AVG(confidence),2) as avg_conf FROM tags WHERE target_repo='$REPO' AND status NOT IN ('REJECTED') GROUP BY kind"
```
What to look for: DEBT count > 20% of PATTERN count signals systemic technical debt, not isolated issues.

**Step 2 — Technology stack:**
```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT json_extract(value,'$.subkind') as subkind, COUNT(*) as count FROM tags WHERE kind='PATTERN' AND status NOT IN ('REJECTED') GROUP BY subkind ORDER BY count DESC"
```
What to look for: Unexpected patterns (a "web" service showing mqtt-subscribe) often indicate undocumented integration points worth investigating.

**Step 3 — Debt by file:**
```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT target_ref, json_extract(value,'$.subkind') as issue, json_extract(value,'$.note') as note, confidence FROM tags WHERE kind='DEBT' AND status NOT IN ('REJECTED') ORDER BY confidence DESC"
```
What to look for: Files with both high PATTERN density and DEBT findings are the highest-risk refactoring candidates — complex code that also has problems.

## Post-Scan Mindset

The scan tells you what patterns exist; it does not interpret them. Interpretation questions to ask after reviewing the three queries:
- **Coverage gaps**: Are there directories with zero tags? That means the packs don't cover that language or framework — not that the code has no patterns.
- **Debt vs pattern ratio**: One DEBT tag per 10 PATTERN tags is expected. Five DEBT tags per 10 PATTERN tags signals a problem area worth highlighting.
- **Unexpected dependencies**: A service tagged with both `dynamodb-client` and `mqtt-publish` warrants a note — that's an unusual coupling between database and IoT messaging layers.

## Guardrails

- **Never call `ast-grep` directly in agent code** — always use `run-structure-scan.sh`. Direct calls bypass session tracking, weight assignment, and deduplication.
- **Never write tags manually for patterns that packs already cover** — scan-written tags include source_evidence and line numbers; manual tags lack this and create duplicates with weaker metadata.
- **Never treat zero DEBT tags as "clean code"** — it means the packs have no rules for those debt patterns. Absence of a debt tag is not evidence of absence of debt.
- **Never assume packs are exhaustive** — packs cover curated patterns for known frameworks. A service using an uncommon ORM or proprietary SDK will have no pattern coverage. Note this gap explicitly when reporting.
- **Never scan the repo root of a monorepo** — patterns match at file level; scanning root floods the tag store with mixed-service findings that are impossible to separate post-hoc.
- **Never reuse a session ID for a different repository** — session IDs are bound to repos at init time. Scanning a second repo into an existing session contaminates findings from both repos.

## Confirming Scan Completeness

Scan errors are logged to stderr by the orchestrator; each pack reports its own success or failure. To confirm the scan ran fully:

```bash
# Check which packs ran and how many tags each produced
cat /path/to/repo/.archimedes/sessions/<session_id>/meta.json | jq '.scan_summary'

# Check total tag count — if 0, something failed silently
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT COUNT(*) as total FROM tags"
```

If total is 0 after scanning a non-trivial repo: verify `ast-grep` is installed, verify the repo path is absolute, and re-check the pack names against `patterns/_registry.yaml`. A pack that silently produces no output (no matching files) is not an error — zero matches on an unrelated codebase is expected.

## Pattern Packs

**MANDATORY: Read `patterns/_registry.yaml`** before adding or enabling packs for a session.

| Pack | Coverage |
|---|---|
| core | Express/FastAPI routes, axios/requests HTTP clients, EventEmitter, Repository/Service classes, hardcoded secrets |
| aws-serverless | Lambda handlers (ESM/CJS/Python), Powertools, cold-start risk, DynamoDB v3, SQS, SNS, EventBridge, Step Functions |
| iot-core | MQTT connect/subscribe/publish/wildcard, Device Shadow, IoT Rules Engine, Greengrass v2 IPC (pub/sub, IoT Core bridge, config, shadow), GGv2 CFn resources, v1 SDK anti-pattern |

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `ast-grep: command not found` | CLI not installed | `npm i -g @ast-grep/cli` |
| Pack name produces no tags | Misspelled pack name | Check `patterns/_registry.yaml` for exact names; orchestrator skips unknown packs silently |
| 0 tags for a known-matching repo | Wrong repo path or packs don't cover the language | Verify path exists; try `core` pack on a TypeScript repo as sanity check |
| 500+ tags on a single generated file | False-positive flood from auto-generated code | Add file to `.archimedes-ignore` at repo root; re-scan |
| DEBT tags but no matching PATTERN tags | Pack finds debt rules but not framework rules | Normal — debt rules are independent of pattern rules; report both separately |
