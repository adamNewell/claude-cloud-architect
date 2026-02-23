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

Arguments are positional and order-sensitive. `repo_path` must be an absolute path to the **service root** (not a subdirectory and not a monorepo root). If the scan produces 0 tags, verify the path first.

## Which Packs to Use

**MANDATORY: READ ENTIRE FILE `references/pack-selection-guide.md`** before choosing packs for a session that involves a new or unfamiliar repository.

**Do NOT load `references/pack-selection-guide.md`** if the packs are already specified in the session's `meta.json` (re-running an existing session).

Quick reference for common cases:
- Pure TypeScript/Python service, no cloud → `core`
- AWS Lambda / DynamoDB → `core,aws-serverless`
- IoT / MQTT / Greengrass → `core,aws-serverless,iot-core` or `core,iot-core`

When uncertain: start with `core` only. Add packs after reviewing what `core` found.

## What It Produces

| Tag Kind | Weight | Status | Examples |
|---|---|---|---|
| PATTERN | HUMAN | VALIDATED | Lambda handlers, Express routes, FastAPI endpoints, Repository classes |
| DEPENDENCY | HUMAN | VALIDATED | DynamoDB clients, SQS producers, axios calls, MQTT publishers |
| DEBT | HUMAN | VALIDATED | DynamoDB Scan anti-pattern, MQTT wildcard subscription, hardcoded credentials, GGv2 v1 SDK |

## Post-Scan Analysis

After scanning, your role shifts from data collection to interpretation. Run these queries in order — each builds on the previous.

**MANDATORY before writing any SQL beyond the three scope-check queries below: READ ENTIRE FILE `cookbook/tag-store/queries.md`** (22 ready-to-use templates). The queries below are scope checks only — do not repurpose them for other analysis. Do NOT load `cookbook/ast-grep/patterns.md` unless you are adding new pattern rules, not running a scan.

**Step 1 — Scope check:**
```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT kind, COUNT(*) as count, ROUND(AVG(confidence),2) as avg_conf FROM tags WHERE target_repo='$REPO' AND status NOT IN ('REJECTED') GROUP BY kind"
```
What to look for: DEBT > 20% of PATTERN count = systemic debt, not isolated issues.

**Step 2 — Technology stack:**
```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT json_extract(value,'$.subkind') as subkind, COUNT(*) as count FROM tags WHERE kind='PATTERN' AND status NOT IN ('REJECTED') GROUP BY subkind ORDER BY count DESC"
```
What to look for: Unexpected patterns (a web service showing `mqtt-subscribe`) indicate undocumented integration points.

**Step 3 — Debt by file:**
```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT target_ref, json_extract(value,'$.subkind') as issue, json_extract(value,'$.note') as note, confidence FROM tags WHERE kind='DEBT' AND status NOT IN ('REJECTED') ORDER BY confidence DESC"
```
What to look for: Files with both high PATTERN density and DEBT findings are highest-risk refactoring candidates.

## Post-Scan Mindset

The scan tells you what patterns exist; it does not interpret them.
- **Coverage gaps**: Directories with zero tags mean the packs don't cover that language — not that the code has no patterns. Document these gaps explicitly (see references/pack-selection-guide.md). When a service produces 0 DEPENDENCY or PATTERN tags despite clearly having external dependencies, document the gap and invoke arch-search for semantic coverage of the uncovered layer.
- **Debt vs pattern ratio**: One DEBT per 10 PATTERN is expected. Five DEBT per 10 PATTERN signals a problem area. Reference baselines in `references/pack-selection-guide.md`.
- **Unexpected cross-domain dependencies**: A service tagged with both `dynamodb-client` and `mqtt-publish` warrants a note — that's unusual coupling between database and IoT messaging layers.

## Guardrails

- **Never call `ast-grep` directly in agent code** — always use `run-structure-scan.sh`. Direct calls bypass session tracking, weight assignment, and deduplication.
- **Never write tags manually for patterns that packs already cover** — scan-written tags include source_evidence and line numbers; manual tags lack this and create duplicates with weaker metadata.
- **Never treat zero DEBT tags as "clean code"** — it means the packs have no rules for those debt patterns. Absence of a debt tag is not evidence of absence of debt.
- **Never assume packs are exhaustive** — packs cover curated patterns for known frameworks. A service using an uncommon ORM or proprietary SDK will have no pattern coverage. Document the gap.
- **Never scan the repo root of a monorepo** — patterns match at file level; scanning root floods the tag store with mixed-service findings that are impossible to separate post-hoc.
- **Never scan a subdirectory below the service root** — `target_ref` paths are recorded relative to the scan root. Tags from `services/user/src/handlers` will have truncated paths that break cross-references with tags from a full-service scan.
- **Never reuse a session ID for a different repository** — session IDs are bound to repos at init time. Scanning a second repo into an existing session contaminates findings from both repos.

## Confirming Scan Completeness

```bash
# Check which packs were registered for this session
cat /path/to/repo/.archimedes/sessions/<session_id>/meta.json | jq '.pattern_packs'

# Check total tag count — if 0, something failed
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT COUNT(*) as total FROM tags"
```

If total is 0 on a non-trivial repo: verify `ast-grep` is installed (`ast-grep --version`), verify the repo path is absolute and points to the service root, and confirm pack names against `patterns/_registry.yaml`. Zero tags from a pack that doesn't match the repo's language is expected and not an error.

## Pattern Packs

**MANDATORY: Read `patterns/_registry.yaml`** before adding or enabling new packs. Do NOT load `cookbook/ast-grep/cli.md` — that file is for pattern authors, not scan runners.

| Pack | Coverage |
|---|---|
| core | Express/FastAPI routes, axios/requests HTTP clients, EventEmitter, Repository/Service classes, hardcoded secrets |
| aws-serverless | Lambda handlers (ESM/CJS/Python), Powertools, cold-start risk, DynamoDB v3, SQS, SNS, EventBridge, Step Functions |
| iot-core | MQTT connect/subscribe/publish/wildcard, Device Shadow, IoT Rules Engine, Greengrass v2 IPC (pub/sub, IoT Core bridge, config, shadow), GGv2 CFn resources, v1 SDK anti-pattern |

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `ast-grep: command not found` | CLI not installed | `npm i -g @ast-grep/cli` |
| Pack name produces no tags | Misspelled pack name | Check `patterns/_registry.yaml`; orchestrator skips unknown packs silently |
| 0 tags for a known-matching repo | Wrong repo path or packs don't cover the language | Verify path is absolute service root; test with `ast-grep --lang typescript` on one file |
| 500+ tags on a single generated file | False-positive flood from auto-generated code | Add file to `.archimedes-ignore` at repo root; re-scan |
| DEBT tags but no matching PATTERN tags | Debt rules are independent of pattern rules | Normal — report both separately |
