---
name: arch-trace-flow
description: "End-to-end operation flow tracing across repositories. Chains arch-navigate (exact symbol location) → arch-observe (role classification) → arch-search (semantic discovery) → arch-flows (Rivière schema synthesis). USE WHEN: tracing a named operation from entry point to storage boundary, mapping cross-repo call chains, producing Rivière flow schemas for architecture documentation, or answering questions like 'show me the trace flow for processDeviceData'. Requires Phase 1 + Phase 2 tags already in session. Keywords: trace flow, operation flow, cross-repo, Rivière, flow schema, call chain, entry point, arch-navigate, arch-observe, arch-search, arch-flows, FLOW tag, riviere builder."
---
# arch-trace-flow

Produce a valid Rivière flow schema for a named operation by chaining four skills in strict order: arch-navigate (symbol anchoring) → arch-observe (role classification) → arch-search (semantic gap fill) → arch-flows (schema synthesis). This is the Phase 3 gate skill.

**Why this order matters:**

- **arch-navigate first** — anchors the probabilistic results from osgrep and chunkhound to a verified file + line number. Without at least one LSP-confirmed entry point, the graph has no reliable root and orphan rate exceeds 20%.
- **arch-observe second** — classifies each node by architectural role (ORCHESTRATION, INTEGRATION, INFRASTRUCTURE) before linking. Role data drives whether a component gets linked as `sync` or `async` and whether it becomes a graph node at all.
- **arch-search third** — semantic query surfaces integration points that neither ast-grep nor osgrep trace output captured (dynamic dispatch, runtime config injection, wrapper patterns). These are the highest-value cross-repo edges.
- **arch-flows last** — schema synthesis is only reliable when all nodes have been verified and their roles classified. Building the graph first and classifying later inverts causality and produces ungradable schemas.

## Pre-flight Check (MANDATORY)

Before starting, verify that Phase 1 + Phase 2 tags are present in the session. If not, run `arch-map-service` first.

```bash
# 1. Confirm the session exists
DB_PATH=$(cat $REPO/.archimedes/sessions/$SESSION/meta.json | jq -r .db_path)

# 2. Count PATTERN (Phase 1) and CANDIDATE (Phase 2) tags
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT kind, weight_class, status, COUNT(*) as count
         FROM tags
         WHERE session_id='$SESSION' AND target_repo='$REPO' AND status NOT IN ('REJECTED')
         GROUP BY kind, weight_class, status
         ORDER BY count DESC"
```

**Pass criteria:**
- At least 1 PATTERN tag with `weight_class=HUMAN` and `status=VALIDATED` → Phase 1 complete
- At least 1 CANDIDATE tag with `weight_class=MACHINE` and `status=CANDIDATE` → Phase 2 complete

If either is missing: **stop and run `arch-map-service` before proceeding.**

---

## Supporting Documentation

| Need | Load |
|------|------|
| riviere builder flags (full reference) | `../../cookbook/riviere/builder.md` (if exists) or `riviere builder --help` |
| Serena MCP tool reference | `../../cookbook/serena/cli.md` |
| Tag schema | `../../cookbook/tag-store/schema.md` |

---

## Step 1: Identify the Entry Point

You must have a **named operation** before calling any sub-skill. "Map the whole system" is not a valid input. Examples of valid named operations:

- `processDeviceData` (Lambda handler)
- `POST /orders` (REST endpoint)
- `onMessageReceived` (MQTT event handler)
- `handleSnapshotUpdate` (EventBridge handler)

Query the tag store for PATTERN tags matching the operation name to locate the likely entry point file:

```bash
# Find route-handler or event-handler tags matching the operation keyword
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT target_ref, json_extract(value,'$.subkind') as subkind,
                json_extract(value,'$.pattern_name') as pattern_name,
                confidence
         FROM tags
         WHERE session_id='$SESSION'
           AND target_repo='$REPO'
           AND status NOT IN ('REJECTED')
           AND kind='PATTERN'
           AND (
             json_extract(value,'$.subkind') IN ('route-handler','event-handler','lambda-handler','mqtt-handler','eventbridge-handler')
             OR target_ref LIKE '%handler%'
             OR target_ref LIKE '%Handler%'
           )
         ORDER BY confidence DESC
         LIMIT 20"
```

**If no PATTERN tags match the operation subkind**, broaden to all PATTERN tags and scan `target_ref` for handler filenames:

```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT DISTINCT target_ref, json_extract(value,'$.subkind') as subkind
         FROM tags
         WHERE session_id='$SESSION'
           AND target_repo='$REPO'
           AND status NOT IN ('REJECTED')
           AND kind='PATTERN'
         ORDER BY target_ref"
```

Read the top candidates manually and select the file whose name or content matches the operation being traced.

---

## Step 2: Navigate — Anchor the Entry Point (arch-navigate)

**Use arch-navigate to get an LSP-verified file + line number for the entry point symbol.** This is not optional — osgrep trace and chunkhound results are probabilistic. One confirmed symbol anchors the entire graph.

### Primary path — find_symbol MCP tool

```
find_symbol(symbol="processDeviceData", repo="/absolute/path/to/repo")
```

Expected return: `{ file: "src/handlers/deviceDataHandler.ts", line: 42, kind: "function" }`

Record: `ENTRY_FILE`, `ENTRY_LINE`, `ENTRY_SYMBOL`.

### Follow callers — find_references

```
find_references(symbol="processDeviceData", file="src/handlers/deviceDataHandler.ts", repo="/absolute/path/to/repo")
```

Record any immediate callers — these become graph nodes if they exist in the same or a related repo.

### Decision tree: what if find_symbol can't find the symbol?

```
find_symbol returns empty or error?
  ├─ Try the class method form: "HandlerClass.processDeviceData"
  ├─ Try the file-scoped form: "src/handlers/deviceDataHandler.ts:processDeviceData"
  ├─ Try fuzzy match on class name: find_symbol(symbol="deviceDataHandler")
  └─ All fail?
       ├─ Fall back to osgrep trace on the directory:
       │     osgrep trace "processDeviceData" --path "${REPO}/src/handlers"
       ├─ If osgrep trace is also empty → manual skeleton analysis:
       │     osgrep skeleton "src/handlers/deviceDataHandler.ts"
       │     Read the file directly to find the function signature
       └─ If the file does not exist → re-check PATTERN tag target_ref (path may be relative)
              Resolve: ENTRY_FILE="${REPO}/${target_ref}"
```

**Minimum bar:** You must exit Step 2 with at least one confirmed file path and a symbol name. A line number is strongly preferred but not blocking.

---

## Step 3: Observe — Classify Roles (arch-observe)

**Use arch-observe on the entry point and its immediate downstream calls to assign architectural roles.** Role assignment determines which components become graph nodes and how they are linked.

### Index confirmation

```bash
osgrep list
```

If symbol count is 0: run `osgrep index --path "${REPO}"` before proceeding.

### Trace the entry point

```bash
osgrep trace "${ENTRY_SYMBOL}"
# Example:
osgrep trace "processDeviceData"
osgrep trace "src/handlers/deviceDataHandler.ts:processDeviceData"
```

Count outgoing calls in the trace output. For each called symbol name visible in the output, add it to your node candidate list.

### Trace each downstream candidate

```bash
osgrep trace "DeviceDataService.process"
osgrep trace "DynamoDBRepository.save"
osgrep trace "SQSClient.sendMessage"
```

Apply the role classification decision tree from arch-observe Step 6:

```
1. outgoing_count >= 6 AND calls other service/repo symbols → ORCHESTRATION
2. outgoing_count <= 1 AND skeleton shows only interface/type declarations → DEFINITION
3. trace output contains: axios, fetch, SQSClient, SNSClient, amqp, EventBridge, grpc → INTEGRATION
4. trace output contains: prisma, typeorm, dynamodb.put, s3.putObject, fs.writeFile → INFRASTRUCTURE
5. skeleton or trace contains: React, useState, render() → FRONTEND
6. None match → UNKNOWN (document which signals were checked)
```

### Decision tree: what if osgrep trace returns empty?

```
osgrep trace returns empty?
  ├─ Run osgrep list — confirm non-zero symbol count
  ├─ If count is 0: run osgrep index --path "${REPO}" then retry
  ├─ If count is non-zero: try directory-scoped trace
  │     osgrep trace "${ENTRY_SYMBOL}" --path "${REPO}/src"
  ├─ If still empty: use osgrep skeleton on the entry file
  │     osgrep skeleton "${ENTRY_FILE}"
  │     Read skeleton for method signatures → classify manually
  └─ If skeleton is also empty: read the source file directly
        Read "${ENTRY_FILE}" and classify by import analysis
        (see arch-observe Fallback: Manual Role Classification)
```

Write a ROLE tag for each classified component (`kind=ROLE`, `weight_class=MACHINE`, `status=CANDIDATE`, `confidence=0.70`). The `value` JSON must include: `role`, `subkind`, `outgoing_calls`, `incoming_calls`, and `description`. Use the same `bun tools/tag-store.ts write --tag '{...}' --session <session-id>` pattern shown in Step 6.

---

## Step 4: Search — Fill Semantic Gaps (arch-search)

**Run a targeted semantic query to surface integration points missed by ast-grep and osgrep.** This step is not about re-discovering the entry point — it is about finding the downstream edges that dynamic dispatch and wrapper patterns hide.

Construct a query from what the operation name implies:

```bash
# Example semantic queries by operation type:
# Lambda handler: "Lambda handler processes incoming event transforms stores result"
# MQTT event:     "MQTT message event handler device data queue consumer"
# REST endpoint:  "REST API controller route handler service call repository"

# For a device data processing operation:
bash tools/run-semantic-scan.sh "${REPO}" "${SESSION}" "${DB_PATH}" "core,aws-serverless,iot-core"
```

After the scan completes, query for CANDIDATE tags that reference files NOT already in your node candidate list:

```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT DISTINCT target_ref, json_extract(value,'$.subkind') as subkind, confidence
         FROM tags
         WHERE session_id='$SESSION'
           AND target_repo='$REPO'
           AND status NOT IN ('REJECTED')
           AND weight_class='MACHINE'
           AND status='CANDIDATE'
           AND kind IN ('PATTERN','DEPENDENCY')
         ORDER BY confidence DESC
         LIMIT 30"
```

For each new file discovered:
1. Run `osgrep trace` on the key symbol from that file
2. Apply the role classification decision tree (Step 3)
3. Add to the node candidate list if it falls within the operation's call boundary

**Boundary rule:** A component is inside the operation boundary if it is reachable in ≤3 hops from the entry point via synchronous calls, or ≤2 hops via async channels (events, queues). Components beyond that boundary are recorded as external links, not graph nodes.

---

## Step 5: Synthesize — Build Rivière Schema (arch-flows)

**Before building the graph, ask:**
- Does every node have a confirmed file path AND a classified role?
- Is every node reachable from the entry point within the boundary rule (≤3 hops sync, ≤2 hops async)?
- If no to either — return to Step 3 (Search) before proceeding.

**Build the Rivière graph from the classified node candidate list.** All nodes must have a confirmed file path and role before synthesis begins.

### Orphan check before starting

Count nodes vs. nodes with at least one incoming or outgoing role link:

```
Orphan rate = (nodes with no osgrep trace links) / (total nodes)
If orphan rate > 20%: STOP — return to Step 3 and classify missing nodes before building the graph.
```

### Initialize the graph

```bash
riviere builder init \
  --source "https://github.com/your-org/your-repo" \
  --domain '{"name":"<primary-domain>","description":"<service description>","systemType":"domain"}'
```

### Add each node as a component (sequential — no concurrent calls)

```bash
# Entry point (API or EventHandler depending on trigger type)
riviere builder add-component \
  --type EventHandler \
  --domain <domain> --module handlers \
  --name "process-device-data" \
  --subscribed-events "DeviceDataReceived" \
  --repository "https://github.com/your-org/repo" \
  --file-path "src/handlers/deviceDataHandler.ts" \
  --line-number 42

# Service orchestrator (UseCase)
riviere builder add-component \
  --type UseCase \
  --domain <domain> --module services \
  --name "process-device-data-service" \
  --repository "https://github.com/your-org/repo" \
  --file-path "src/services/deviceDataService.ts" \
  --line-number 10

# Storage boundary (DomainOp)
riviere builder add-component \
  --type DomainOp \
  --domain <domain> --module domain \
  --name "device-data.save" \
  --entity DeviceData --operation-name save \
  --repository "https://github.com/your-org/repo" \
  --file-path "src/domain/DeviceData.ts" \
  --line-number 23
```

**Component type mapping from role classification:**

| Role | Rivière Type |
|------|-------------|
| ORCHESTRATION (lambda-handler, route-handler) | EventHandler or API |
| ORCHESTRATION (service class) | UseCase |
| INFRASTRUCTURE (database write) | DomainOp |
| INTEGRATION (queue/event publish) | Event |
| INTEGRATION (event consumer) | EventHandler |
| DEFINITION | skip — pure type definitions are not graph nodes |

### Link components

Component ID format: `{domain}:{module}:{type-lowercase}:{name-lowercase-hyphenated}`

```bash
# Sync call from entry handler to service
riviere builder link \
  --from "<domain>:handlers:eventhandler:process-device-data" \
  --to-domain <domain> --to-module services --to-type UseCase --to-name "process-device-data-service" \
  --link-type sync

# Sync call from service to storage
riviere builder link \
  --from "<domain>:services:usecase:process-device-data-service" \
  --to-domain <domain> --to-module domain --to-type DomainOp --to-name "device-data.save" \
  --link-type sync

# Async event publish (e.g., to SQS)
riviere builder link \
  --from "<domain>:services:usecase:process-device-data-service" \
  --to-domain <domain> --to-module events --to-type Event --to-name "device-data-processed" \
  --link-type async

# External system link (e.g., DynamoDB, external API)
riviere builder link-external \
  --from "<domain>:domain:domainop:device-data.save" \
  --target-name "DynamoDB" \
  --link-type sync
```

### Validate and finalize

```bash
# Check for orphans before finalizing
riviere builder check-consistency --json

# Full schema validation
riviere builder validate --json

# Finalize — exports to .riviere/graph.json
riviere builder finalize --output .riviere/graph.json
```

**Orphan threshold:** If `check-consistency` reports >20% orphan components, do not finalize. Return to Step 3 and trace the orphaned component's symbol to find its connecting edge.

---

## Step 6: Write FLOW Tag

After successful finalization, write the schema path as a FLOW tag to the session:

```bash
bun tools/tag-store.ts write --tag '{
  "target_type": "FILE",
  "target_ref": ".riviere/graph.json",
  "target_repo": "/absolute/path/to/repo",
  "kind": "FLOW",
  "value": "{\"operation\": \"processDeviceData\", \"entry_point\": \"src/handlers/deviceDataHandler.ts:42\", \"node_count\": 4, \"link_count\": 3, \"orphan_rate\": 0.0, \"schema_path\": \".riviere/graph.json\"}",
  "confidence": 0.95,
  "weight_class": "HUMAN",
  "source_tool": "riviere-builder",
  "source_query": "builder finalize",
  "source_evidence": "Rivière schema validated with 0 errors, 4 components, 3 links, 0% orphan rate",
  "status": "VALIDATED",
  "session_id": "<session-id>"
}' --session <session-id>
```

Use `weight_class=HUMAN` and `confidence=0.95` — the schema was built from LSP-verified symbols and validated by `riviere builder validate`.

Verify: query `kind='FLOW'` on the session and confirm `operation`, `node_count`, and `orphan_rate` fields are present.

---

## What Each Tier Adds

| Tier | Tool | What it finds | What it misses |
|------|------|---------------|----------------|
| Tier 1 (Phase 1) | ast-grep PATTERN tags | Deterministic handler registrations, decorator-based routes, explicit import chains | Dynamic dispatch, runtime-injected dependencies, business logic buried in closures |
| Tier 2 (Phase 2) | chunkhound CANDIDATE tags | Semantic patterns: NVA commands, score calculators, multi-db routing, wrapper patterns | Exact file+line anchoring; probabilistic — needs verification |
| Tier 3 (Phase 3) | osgrep trace + find_symbol | Verified call graph from actual AST/LSP symbols; fan-out counts; exact file+line | Cannot cross repo boundaries; misses dynamically-constructed symbol names |
| Synthesis | riviere builder | Persistent, queryable, schema-validated flow graph | Nothing — this is the output, not a discovery tool |

Cross-tier correlation is the key insight: PATTERN tags identify candidate entry points → arch-navigate confirms file+line → arch-observe classifies each node → arch-search fills cross-repo gaps → arch-flows records the graph permanently.

---

## NEVER

- **NEVER start flow synthesis without a named operation** — "map the whole system" produces an ungradable graph with no defined entry point. Require the caller to name a specific operation (function, route, or event) before proceeding.
- **NEVER skip arch-navigate** — probabilistic results from osgrep and chunkhound must be anchored by at least one LSP-verified symbol. A graph built entirely from probabilistic sources will fail the orphan threshold check.
- **NEVER finalize a Rivière graph with >20% orphan components** — run `riviere builder check-consistency --json` before `finalize`. If orphan rate exceeds 20%, trace the orphaned symbols and add the missing links before finalizing.
- **NEVER use `riviere builder link --source` or `--target`** — the correct flags are `--from`, `--to-domain`, `--to-module`, `--to-type`, `--to-name`. Using `--source`/`--target` will fail with an unknown flag error.
- **NEVER run `add-component` calls concurrently** — concurrent writes cause data loss in the graph file. All `add-component` and `enrich` calls must be sequential.
- **NEVER classify a component as ORCHESTRATION based on its filename alone** — filenames like `WorkflowManager.ts` are weak signals. Require `outgoing_count >= 6` from `osgrep trace` output before assigning the ORCHESTRATION role.
- **NEVER write a FLOW tag before `riviere builder validate` exits with code 0** — a schema that fails validation is not a Rivière schema. The FLOW tag must point to a valid, finalized graph.
- **NEVER scan a different repo into an existing session** without verifying session tags are from the correct repo — session contamination produces cross-repo false DEPENDENCY tags that invalidate flow synthesis.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `find_symbol` returns empty | Symbol name is method on a class | Try `ClassName.methodName` form or file-scoped `path/to/file.ts:symbol` |
| `osgrep trace` returns empty | Index not built or stale | Run `osgrep list`; if count=0, run `osgrep index --path "${REPO}"` |
| Orphan rate >20% | Downstream components not traced | Run `osgrep trace` on each orphaned symbol; add the missing link with `riviere builder link` |
| `riviere builder link` fails with unknown flag | Using `--source`/`--target` syntax | Replace with `--from`/`--to-domain`/`--to-module`/`--to-type`/`--to-name` |
| `riviere builder validate` reports missing required fields | `add-component` call missing a type-specific flag | Re-add the component with the required flag (e.g., `--subscribed-events` for EventHandler, `--entity` for DomainOp) |
| Phase 1 or Phase 2 tags missing | `arch-map-service` was not run | Stop; run `arch-map-service` for the session; return to pre-flight check |
| FLOW tag has `orphan_rate` > 0.20 | Graph finalized before consistency check | Re-open graph, trace orphans, add missing links, re-validate, re-finalize, update FLOW tag |
| `riviere builder init` fails with "invalid systemType" | `systemType` value is not one of the accepted literals | `systemType` must be exactly: `domain`, `system`, `external`, or `ui`. Not "service", not "Lambda", not capitalized. |
