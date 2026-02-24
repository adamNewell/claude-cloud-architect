---
name: arch-observe
description: "Role classification and call-chain analysis using osgrep semantic index. USE WHEN: classifying code components by architectural role (ORCHESTRATION, DEFINITION, INTEGRATION, INFRASTRUCTURE, FRONTEND), tracing call chains between components, detecting coupling hotspots, or understanding the structural role of a service without reading every file. Produces ROLE, DEPENDENCY, and DEBT tags. Keywords: role classify, orchestrator detect, coupling hotspot, call chain, component topology, fan-out analysis, component coupling, architecture topology, osgrep trace, osgrep symbols."
---
# arch-observe

Classify architectural roles and trace call chains using osgrep's semantic index. The `osgrep classify` command does not exist in v0.5.16 — role classification is performed via a heuristic pipeline: index → symbols → trace → skeleton → role scoring.

**Core principle:** Role evidence is collected from osgrep output, not inferred from filenames or location. A component is ORCHESTRATION only when `osgrep trace` demonstrates high outgoing call fan-out. A component is DEFINITION only when `osgrep skeleton` shows interface/type declarations with no method bodies. Evidence drives the tag, not the component's name or directory path.

## Supporting Documentation

| Need | When to Load |
|------|-------------|
| osgrep CLI flags and command reference | **MANDATORY** — load `../../cookbook/osgrep/cli.md` only if a command flag is unfamiliar. Do NOT load it for standard index/trace/skeleton/symbols invocations covered in this skill. |
| Tag schema fields and confidence gradient | **MANDATORY** — load `../../cookbook/tag-store/schema.md` only if unfamiliar with field names. Do NOT load it for standard ROLE/DEPENDENCY/DEBT writes — the examples in Step 7 are self-contained. |

## Before You Classify: Pre-Flight Decision Gates

Run through these before issuing any osgrep commands. If the answer to any gate is NO or UNKNOWN, stop and resolve it first.

| Gate | Check | Stop Condition |
|------|-------|----------------|
| **Scope** | Is `$REPO` an absolute path to the service root — not the monorepo root, not a subdirectory? | Stop if pointing at monorepo root — see Guardrails |
| **Index freshness** | Has the codebase changed since last index? | Stop and re-index with `--reset` before tracing |
| **Language coverage** | Run `osgrep list` — does it show non-zero file and symbol counts? (TypeScript/Python/Go: yes. Rust/Elixir: uncertain.) | Stop if zero counts — wrong path or unsupported language |
| **Classification scope** | Are you classifying entry-point services and handlers, not test files or generated code? | Stop and filter out test files before proceeding |

Trace on a stale or partial index returns empty output with exit code 0 — no error, no warning, silently zero results. Every component then appears to have `outgoing_count=0` and gets classified DEFINITION or UNKNOWN. The pre-flight gates prevent this failure mode.

## Confidence

All osgrep-derived findings: `confidence=0.70`, `weight_class=MACHINE`, `status=CANDIDATE`

Manual heuristic classifications (fallback path): `confidence=0.60`, `weight_class=MACHINE`, `status=CANDIDATE`

Role classification is reliable for components >200 LOC with >3 exported symbols. For small utility files (<100 LOC, <3 exported symbols), signals are ambiguous — annotate with `confidence=0.55` and document the ambiguity in `source_evidence`.

---

## Step 1: Index the Repository

```bash
osgrep index --path "${REPO}"
```

Confirm with `osgrep list`. Zero symbols = unsupported language or wrong path — do not proceed. Re-index after source changes: `osgrep index --path "${REPO}" --reset`.

---

## Step 2: Enumerate Candidate Components

```bash
# List all indexed symbols — one line per exported symbol
osgrep symbols --path "${REPO}/src"

# Narrow to likely service entry points
osgrep symbols "Service|Controller|Handler|Coordinator|Repository|Adapter|Gateway"
```

Collect the top 20–30 symbol names. Skip symbols matching `test|spec|mock|fixture|__` — test scaffolding does not have architectural roles.

---

## Step 3: Trace Call Chains (Role Signal Collection)

For each candidate symbol, run `osgrep trace` and count outgoing call references:

```bash
osgrep trace "${SYMBOL}"
# Example:
osgrep trace "OrderService.processOrder"
osgrep trace "src/orders/order.service.ts:processOrder"
```

**Reading trace output — what you will see:**

osgrep trace produces a call tree. Example output:
```
OrderService.processOrder
  → PaymentService.charge          (src/payments/payment.service.ts:45)
  → OrderRepository.save           (src/orders/order.repository.ts:12)
  → NotificationService.send       (src/notifications/notification.service.ts:88)
  → AuditLogger.log                (src/audit/audit-logger.ts:33)
  ← InvoiceController.submit       (src/invoices/invoice.controller.ts:21)
  ← RetryWorker.retry              (src/workers/retry.worker.ts:67)
```

**What to count:**
- Lines prefixed with `→` (outgoing calls to other components) → `outgoing_count`
- Lines prefixed with `←` (components that call this symbol) → `incoming_count`

Record `outgoing_count` and `incoming_count` for each symbol before moving to classification.

---

## Step 4: Inspect Code Signatures (for Ambiguous Cases)

For components with borderline trace counts (`outgoing_count` between 2–5), inspect their signatures:

```bash
osgrep skeleton "${FILE_PATH}"
# Example:
osgrep skeleton "src/domain/order.ts"
```

Skeleton output shows method signatures and type declarations without bodies. DEFINITION components show only `interface`, `type`, `enum`, and class declarations with no method bodies. ORCHESTRATION components show methods that reference other service types by name.

---

## Step 5: Semantic Confirmation (Optional but High-Value)

For each role hypothesis, run a targeted semantic search to confirm:

```bash
# Confirm orchestration candidates
osgrep search "coordinates service calls executes workflow" "${REPO}/src"

# Confirm integration/adapter candidates
osgrep search "HTTP client external API queue publish consume" "${REPO}/src"

# Confirm infrastructure candidates
osgrep search "database query ORM repository transaction" "${REPO}/src"

# Confirm frontend candidates
osgrep search "component render UI state props" "${REPO}/src"
```

Semantic results that co-locate with a trace-derived candidate strengthen the role assignment. **Conflicting signals** (trace says ORCHESTRATION, semantic search returns infrastructure results for the same file) → reclassify as UNKNOWN and record both signals in `source_evidence`.

---

## Step 6: Apply Role Classification Decision Tree

Apply in order — first match wins:

```
1. outgoing_count >= 6 AND calls other named service/repo symbols
   → ORCHESTRATION

2. outgoing_count <= 1 AND skeleton shows only interface/type/class-with-no-body
   → DEFINITION

3. trace output → lines contain: axios, fetch, http.request, SQSClient, SNSClient,
   amqp, redis.publish, EventBridge, grpc
   → INTEGRATION

4. trace output → lines contain: prisma, typeorm, mongoose, knex, pg.query,
   fs.writeFile, s3.putObject, dynamodb.put
   → INFRASTRUCTURE

5. skeleton or trace → lines contain: React, useState, useEffect, Vue, Svelte,
   JSX, render()
   → FRONTEND

6. None of the above match
   → UNKNOWN (record which signals were checked and their values)
```

**Coupling hotspot detection (DEBT signal):**

Any component with `outgoing_count >= 10` is a coupling hotspot regardless of role. Write a DEBT tag even if role classification resolves cleanly.

**When to raise the ORCHESTRATION threshold:**

If ORCHESTRATION accounts for >40% of classified components, raise the fan-out threshold from 6 to 8 and reclassify borderline cases (outgoing 6–7) using skeleton inspection. Over-detection at threshold 6 is common in service-heavy TypeScript codebases where every class injects a logger, config reader, and metrics client.

---

## Step 7: Write Tags

The examples below are self-contained. **Do NOT load `../../cookbook/tag-store/schema.md`** unless a field is missing from the examples — loading it for standard writes wastes context.

### ROLE tag

```bash
bun tools/tag-store.ts write --tag '{
  "target_type": "FILE",
  "target_ref": "src/orders/order.service.ts",
  "target_repo": "/absolute/path/to/repo",
  "kind": "ROLE",
  "value": "{\"role\": \"ORCHESTRATION\", \"subkind\": \"service-orchestrator\", \"outgoing_calls\": 9, \"incoming_calls\": 2, \"description\": \"High fan-out coordinator: calls OrderRepo, PaymentService, NotificationService, AuditLogger\"}",
  "confidence": 0.70,
  "weight_class": "MACHINE",
  "source_tool": "osgrep",
  "source_query": "trace OrderService.processOrder",
  "source_evidence": "Trace output: 9 outgoing → references to named service symbols; 2 ← incoming callers",
  "status": "CANDIDATE",
  "session_id": "<session-id>"
}' --session <session-id>
```

### DEPENDENCY tag (call chain relationship)

Write one DEPENDENCY tag per caller→callee pair discovered in trace output:

```bash
bun tools/tag-store.ts write --tag '{
  "target_type": "FILE",
  "target_ref": "src/orders/order.service.ts",
  "target_repo": "/absolute/path/to/repo",
  "kind": "DEPENDENCY",
  "value": "{\"subkind\": \"internal-service-call\", \"callee\": \"src/payments/payment.service.ts\", \"caller\": \"src/orders/order.service.ts\", \"symbol\": \"PaymentService.charge\"}",
  "confidence": 0.70,
  "weight_class": "MACHINE",
  "source_tool": "osgrep",
  "source_query": "trace OrderService.processOrder",
  "source_evidence": "PaymentService.charge appears as → line in trace output for OrderService.processOrder",
  "status": "CANDIDATE",
  "session_id": "<session-id>"
}' --session <session-id>
```

### DEBT tag (coupling hotspot)

```bash
bun tools/tag-store.ts write --tag '{
  "target_type": "FILE",
  "target_ref": "src/orders/order.service.ts",
  "target_repo": "/absolute/path/to/repo",
  "kind": "DEBT",
  "value": "{\"subkind\": \"coupling-hotspot\", \"pattern_name\": \"high-fan-out\", \"outgoing_calls\": 11, \"threshold\": 10, \"note\": \"11 outgoing service dependencies — exceeds threshold of 10. Extract sub-workflows into dedicated coordinator classes to reduce coupling.\"}",
  "confidence": 0.70,
  "weight_class": "MACHINE",
  "source_tool": "osgrep",
  "source_query": "trace OrderService.processOrder",
  "source_evidence": "11 → lines counted in osgrep trace output",
  "status": "CANDIDATE",
  "session_id": "<session-id>"
}' --session <session-id>
```

---

## Fallback: Manual Role Classification

If osgrep is unavailable (not installed, setup not run, or index fails), read source files directly and classify using these signals:

| Signal | Role |
|--------|------|
| Imports 5+ service/repo/handler classes AND calls `.execute()`, `.process()`, `.run()`, or `.handle()` on them | ORCHESTRATION |
| File is primarily `interface`, `type`, `enum`, or `class` declarations with no method bodies | DEFINITION |
| Imports `axios`, `node-fetch`, `got`, `SQSClient`, `SNSClient`, `amqplib`, `ioredis`, `EventBridgeClient` — external I/O | INTEGRATION |
| Imports Prisma, TypeORM, Mongoose, Knex, `pg`, or accesses `fs`, `S3Client`, `DynamoDB` directly | INFRASTRUCTURE |
| Imports `React`, `Vue`, `Svelte`, `@angular/core`, uses JSX/TSX, exports components | FRONTEND |

Write manual classifications with `confidence=0.60`. Set `source_tool` to `"manual-heuristic"` and `source_evidence` to the specific import line or method call pattern that triggered the rule.

---

## Post-Classification Analysis

After writing ROLE tags, run this scope check:

```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT json_extract(value,'$.role') as role, COUNT(*) as count FROM tags WHERE target_repo='$REPO' AND session_id='$SESSION' AND kind='ROLE' AND status NOT IN ('REJECTED') GROUP BY role ORDER BY count DESC"
```

**What to look for:**
- ORCHESTRATION > 30% of total → overly centralized architecture; look for DEBT coupling patterns
- UNKNOWN > 20% of total → index is likely stale or incomplete; re-run `osgrep index --reset`
- Zero DEFINITION in a typed language (TypeScript, Java) → the codebase mixes types into service files; search for DEFINITION signals inside files classified as ORCHESTRATION

**Promote or reject ROLE candidates:**

```bash
# After confirming trace evidence matches current source
bun tools/tag-store.ts promote --db $DB_PATH --tag-id <uuid>

# If file was refactored after indexing or trace was ambiguous
bun tools/tag-store.ts reject --db $DB_PATH --tag-id <uuid>
```

Promotion rule: Read `source_evidence` and confirm the outgoing call count in the current source file matches the trace output. If the file was refactored after indexing, reject and re-index before re-classifying.

---

## Guardrails

- **Never classify as ORCHESTRATION based on file name alone** — names like `OrderManager.ts` or `WorkflowCoordinator.ts` are weak signals. Require `outgoing_count >= 6` from actual trace output. Naming conventions are inconsistent across teams; trace output is not.
- **Never skip `osgrep index` and run search or trace directly** — trace on a missing or stale index returns empty output with exit code 0. The command succeeds silently. Every component then appears to have `outgoing_count=0` and gets classified as DEFINITION or UNKNOWN. Always confirm `osgrep list` shows non-zero counts before tracing.
- **Never write ROLE tags for test files** — `*.test.ts`, `*.spec.ts`, `__mocks__`, and fixture directories are scaffolding. Tagging them inflates UNKNOWN counts because test helpers do not fit any architectural role cleanly. Their trace output also pulls in the components under test, corrupting outgoing call counts.
- **Never treat `outgoing_count=1` as DEFINITION evidence** — a file calling only a logger or metrics client has one outgoing call but is a leaf service, not a domain type. DEFINITION requires skeleton inspection confirming interface/type declarations with no method bodies — the absence of behavior, not the absence of calls.
- **Never apply the coupling hotspot DEBT threshold to DEFINITION or FRONTEND components** — type files legitimately import dozens of other types. UI components legitimately import dozens of child components. The `outgoing_count >= 10` DEBT signal applies to ORCHESTRATION and INTEGRATION roles only.
- **Never promote ROLE tags after a `--reset` re-index without re-running trace** — a reset index rebuilds call counts from current source. Outgoing counts may change if the service was refactored. Promoting stale trace-derived tags creates authoritative facts that no longer reflect the codebase.
- **Never index the monorepo root** — trace output becomes ambiguous when the same symbol name resolves to multiple files across services. Set `--path` to the specific service root. A trace for `UserService.create` in a monorepo returns calls from three different services if the index spans all of them.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `osgrep trace` returns empty output | Index not built or stale | Run `osgrep index --path $REPO` then `osgrep list` to confirm non-zero symbol counts |
| All components classified UNKNOWN | Symbols use non-standard naming (no Service/Controller suffix) | Run `osgrep symbols` without a filter; inspect raw output for the actual naming convention in use |
| ORCHESTRATION over-detected (>40%) | Default fan-out threshold (6) too low for this codebase | Raise threshold to 8; recheck borderline components (outgoing 6–7) with `osgrep skeleton` |
| `osgrep skeleton` returns no output | File path mismatch with index root | Pass path relative to where `osgrep index` was run, not relative to cwd |
| Index rebuild takes >10 minutes | Large repo (>50K files) | Add `.osgrep-ignore` to exclude `node_modules`, `dist`, `build`, `vendor`, `.git` |
| Same symbol appears in multiple trace outputs as different roles | Monorepo indexed at root, not service root | Re-index with `--path` set to the specific service root; `--reset` to clear previous index |
| `osgrep setup` fails on air-gapped machine | Network restriction blocking model download | Pre-download models on an unrestricted machine; copy to `~/.osgrep/models/` |
