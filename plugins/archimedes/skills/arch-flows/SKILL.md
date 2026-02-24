---
name: arch-flows
description: "Cross-repo flow synthesis using Riviere. USE WHEN: constructing end-to-end operation flows that span multiple repositories, synthesizing UI-to-backend-to-events operation paths from accumulated tag store findings, mapping flow entry points from ORCHESTRATION ROLE tags and route-handler PATTERN tags, or producing a Riviere schema from an IaC topology scaffold. Reads ROLE, DEPENDENCY, and PATTERN tags as input. Produces FLOW and BOUNDARY tags plus a validated Riviere graph. Keywords: flow synthesis, Riviere, cross-repo, end-to-end operation, entry point, trace, flow schema, domain boundary, riviere builder, riviere query."
---
# arch-flows

Synthesize cross-repo end-to-end operation flows using Riviere's builder and query pipeline. This skill reads the tag store findings accumulated by arch-structure, arch-search, and arch-observe, then constructs a validated Riviere graph that makes service boundaries and data flows explicit.

**Core principle:** FLOW and BOUNDARY tags are only written after a Riviere schema backs them. Never write FLOW tags from tag store inference alone — the Riviere graph is the schema-enforcement layer that makes these findings trustworthy.

**Thinking framework for each flow:** What is the flow's entry trigger? What data does it read? What does it write? Where does it terminate?

## Supporting Documentation

Load these files at the precise step where you need them. Do NOT load them upfront.

| When | Load |
|------|------|
| Before writing FLOW or BOUNDARY tags (Steps 9–10) | **MANDATORY: read entire file** `../../cookbook/tag-store/schema.md` |
| Before writing custom SQL beyond the four queries in Step 1 | **MANDATORY: read entire file** `../../cookbook/tag-store/queries.md` |

**Do NOT load** `../../cookbook/tag-store/schema.md` or `../../cookbook/tag-store/queries.md` while building the Riviere graph (Steps 3–8). Load only when you reach the tag-writing steps.

## Confidence

| Tag Kind | weight_class | confidence | status |
|---|---|---|---|
| FLOW | HUMAN | 0.80 | VALIDATED |
| BOUNDARY | MACHINE | 0.70 | CANDIDATE |

Flows derived from IaC topology scaffold (arch-structure at 0.95 confidence) inherit higher-quality backing and may use confidence=0.85.

## Pre-flight: Set $SESSION, $REPO, $DB_PATH

All tag store queries and Riviere commands require these variables:

```bash
# Set session variables
export SESSION=<session-id>
export REPO=<absolute-path-to-primary-repo>
export DB_PATH=$(cat $REPO/.archimedes/sessions/$SESSION/meta.json | jq -r .db_path)

# Set graph path (one graph per session, lives alongside the session)
export GRAPH=$REPO/.archimedes/sessions/$SESSION/riviere-graph.json
```

## Step 1: Load Tag Store Context

Query the tag store for the three categories of findings that identify flow entry points and dependency chains.

**ORCHESTRATION entry points** — components that coordinate multi-step operations:

```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT target_ref, target_repo, value FROM tags
         WHERE kind='ROLE' AND json_extract(value,'$.role')='ORCHESTRATION'
           AND status NOT IN ('REJECTED')
         ORDER BY confidence DESC"
```

**Route-handler entry points** — HTTP API surfaces:

```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT target_ref, target_repo, value FROM tags
         WHERE kind='PATTERN' AND json_extract(value,'$.subkind')='route-handler'
           AND status NOT IN ('REJECTED')
         ORDER BY confidence DESC"
```

**High-confidence DEPENDENCY chains** — cross-component and cross-repo links:

```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT target_ref, target_repo, value FROM tags
         WHERE kind='DEPENDENCY' AND confidence >= 0.70
           AND status NOT IN ('REJECTED')
         ORDER BY confidence DESC"
```

**Event-handler entry points** — async consumers:

```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT target_ref, target_repo, value FROM tags
         WHERE kind='PATTERN'
           AND json_extract(value,'$.subkind') IN ('sqs-consumer','event-handler','lambda-handler')
           AND status NOT IN ('REJECTED')"
```

## Step 2: Identify Flow Entry Points

Flow entry points fall into four categories. Work through each category from the query results above:

1. **Route handlers** — `PATTERN` tags with `subkind=route-handler` — each HTTP method+path pair is a separate entry point.
2. **ORCHESTRATION components** — `ROLE` tags with `role=ORCHESTRATION` — these are controllers or use-case coordinators.
3. **Event consumers** — `PATTERN` tags for SQS, SNS, EventBridge, or MQTT subscribers.
4. **Scheduled tasks** — IaC `DEPENDENCY` tags pointing to schedulers (EventBridge Scheduler, cron expressions).

List all entry points before building the graph. If a repo has >15 entry points, group them by domain before tracing.

**When an entry point has no downstream DEPENDENCY tags:** Do not synthesize the downstream chain. Add the entry point component to the graph with no outgoing links, note it in the FLOW tag description as `"coverage_gap": true`, and set confidence to 0.50 rather than 0.80. This is preferable to inventing a flow path — a flagged gap is honest; a fabricated chain corrupts the graph.

## Step 3: Initialize the Riviere Graph

One graph per session. If the graph already exists (resuming a session), skip `init` and proceed to `add-component`.

```bash
# Single-repo system
riviere builder init \
  --name "<system-name>" \
  --source "<repo-url>" \
  --domain '{"name":"<domain>","description":"<description>","systemType":"domain"}' \
  --graph $GRAPH

# Multi-repo system (repeat --source and --domain for each)
riviere builder init \
  --name "<system-name>" \
  --source "https://github.com/org/service-a" \
  --source "https://github.com/org/service-b" \
  --domain '{"name":"service-a","description":"<description>","systemType":"domain"}' \
  --domain '{"name":"service-b","description":"<description>","systemType":"domain"}' \
  --graph $GRAPH
```

**Component ID formation:** Riviere auto-generates component IDs as `domain:module:type:name` (all lowercase, spaces converted to hyphens). Example: a component with `--domain orders --module checkout --type UseCase --name "Place Order"` gets ID `orders:checkout:usecase:place-order`. Use this formula when composing `--from` arguments for the link command.

## Step 4: Add Components

For each entry point and downstream component found in the tag store:

```bash
# API entry point (route handler)
riviere builder add-component \
  --type API \
  --name "device-ingest-handler" \
  --domain "device-data" \
  --module "handlers" \
  --repository "https://github.com/org/service-a" \
  --file-path "src/handlers/deviceIngest.ts" \
  --http-method POST \
  --http-path "/api/v1/devices/ingest" \
  --api-type REST \
  --graph $GRAPH

# Use case / orchestrator
riviere builder add-component \
  --type UseCase \
  --name "process-device-reading" \
  --domain "device-data" \
  --module "use-cases" \
  --repository "https://github.com/org/service-a" \
  --file-path "src/use-cases/processDeviceReading.ts" \
  --graph $GRAPH

# Domain operation (DB write, external call)
riviere builder add-component \
  --type DomainOp \
  --name "save-reading" \
  --domain "device-data" \
  --module "repository" \
  --repository "https://github.com/org/service-a" \
  --file-path "src/repository/readingRepository.ts" \
  --operation-name "saveReading" \
  --entity "DeviceReading" \
  --graph $GRAPH

# Event (queue publish / async boundary)
riviere builder add-component \
  --type Event \
  --name "reading-processed" \
  --domain "device-data" \
  --module "events" \
  --repository "https://github.com/org/service-a" \
  --event-name "ReadingProcessed" \
  --graph $GRAPH

# Event handler (async consumer in another repo)
riviere builder add-component \
  --type EventHandler \
  --name "reading-notification-handler" \
  --domain "notifications" \
  --module "handlers" \
  --repository "https://github.com/org/service-b" \
  --file-path "src/handlers/readingNotification.ts" \
  --subscribed-events "ReadingProcessed" \
  --graph $GRAPH
```

**Component type reference:**

| Type | When to use |
|---|---|
| UI | Frontend route / page component |
| API | HTTP endpoint (REST, GraphQL) |
| UseCase | Orchestrator, controller, application-layer coordinator |
| DomainOp | Repository method, DB write, external API call |
| Event | Message published to queue or event bus |
| EventHandler | Subscriber / consumer of an event |
| Custom | Anything that does not fit the above |

## Step 5: Link Components

Link components in flow order using `--from` (source component ID) and `--to-*` flags for the target. The `--from` value is the auto-generated ID: `domain:module:type:name` (lowercase, spaces → hyphens).

**CRITICAL:** Use `--from` / `--to-domain` / `--to-module` / `--to-type` / `--to-name`. Do NOT use `--source` / `--target` — those flags do not exist.

```bash
# Sync link: API → UseCase
riviere builder link \
  --from "device-data:handlers:api:device-ingest-handler" \
  --to-domain device-data \
  --to-module use-cases \
  --to-type UseCase \
  --to-name "process-device-reading" \
  --link-type sync \
  --graph $GRAPH

# Sync link: UseCase → DomainOp (DB write)
riviere builder link \
  --from "device-data:use-cases:usecase:process-device-reading" \
  --to-domain device-data \
  --to-module repository \
  --to-type DomainOp \
  --to-name "save-reading" \
  --link-type sync \
  --graph $GRAPH

# Async link: UseCase → Event (queue publish, crosses repo boundary)
riviere builder link \
  --from "device-data:use-cases:usecase:process-device-reading" \
  --to-domain device-data \
  --to-module events \
  --to-type Event \
  --to-name "reading-processed" \
  --link-type async \
  --graph $GRAPH

# Async link: Event → EventHandler (consumer in service-b)
riviere builder link \
  --from "device-data:events:event:reading-processed" \
  --to-domain notifications \
  --to-module handlers \
  --to-type EventHandler \
  --to-name "reading-notification-handler" \
  --link-type async \
  --graph $GRAPH
```

Before choosing link-type, ask: "Does the caller wait for the result?" If yes → `sync`. If the caller publishes and moves on → `async`.

Use `--link-type sync` for direct calls (HTTP, function call, DB write). Use `--link-type async` for queue publishes, event bus emissions, and any fire-and-forget path. When uncertain, check the DEPENDENCY tag's `subkind` — `sqs-producer`, `sns-publish`, `mqtt-publish`, and `eventbridge-put` are always `async`.

## Step 6: Validate and Diagnose

Always validate before finalizing. Address errors before proceeding.

```bash
# Validate graph structure
riviere builder validate --graph $GRAPH

# Check for orphan components (no links in either direction)
riviere query orphans --graph $GRAPH

# Check structural issues (missing domains, broken references)
riviere builder check-consistency --graph $GRAPH

# Summarize component counts by type and domain
riviere builder component-summary --graph $GRAPH
```

**Validation failure remediation:**

| Symptom | Cause | Fix |
|---|---|---|
| Component ID not found in link | Typo in `--from` or `--to-name` | Run `riviere query components --graph $GRAPH` to list all IDs |
| Orphan rate > 20% | Missing links or incomplete coverage | Link orphans or remove components with no evidence |
| Domain not registered | `--to-domain` references an undeclared domain | Re-run `riviere builder add-domain --name <domain> --graph $GRAPH` |
| Circular dependency warning | Flow loops back to entry point | Verify flow direction; add a note in the FLOW tag description |

**Never finalize a graph with >20% orphan components.** Run `riviere query orphans --json --graph $GRAPH` and link or remove each orphan before finalizing.

## Step 7: Trace and Verify Flows

After linking, use `riviere query trace` to verify each flow before writing tags.

```bash
# Trace from a specific entry point (bidirectional)
riviere query trace "device-data:handlers:api:device-ingest-handler" --graph $GRAPH

# List all entry points the graph recognizes
riviere query entry-points --graph $GRAPH

# Trace in JSON for programmatic use
riviere query trace "device-data:handlers:api:device-ingest-handler" --json --graph $GRAPH
```

The component ID format for `trace` is the same auto-generated format: `domain:module:type:name` (lowercase, spaces → hyphens).

Confirm that each trace output matches the expected flow path from the tag store context. If a step is missing, add the component and link before writing tags.

**Before proceeding to Step 8, verify all of the following:**

```
[ ] riviere query orphans --graph $GRAPH  →  orphan rate < 20%
[ ] riviere builder validate --graph $GRAPH  →  zero errors
[ ] riviere query entry-points --graph $GRAPH  →  all expected entry points appear
[ ] Every --link-type async has a corresponding BOUNDARY tag planned for Step 10
[ ] Every cross-repo link has both repos declared in riviere builder init --source
[ ] Every component in the graph corresponds to a DEPENDENCY or ROLE tag in the tag store
[ ] Every planned FLOW tag target_ref matches a traceable path in riviere query trace output
```

## Step 8: Finalize the Graph

```bash
riviere builder finalize \
  --graph $GRAPH \
  --output $REPO/.archimedes/sessions/$SESSION/riviere-final.json
```

Finalization validates the graph a final time and writes the output artifact. Use `--output` to keep the working graph (`$GRAPH`) and the finalized export (`riviere-final.json`) separate.

## Step 9: Write FLOW Tags

Write one FLOW tag per end-to-end operation. The `target_ref` is the flow's canonical name (kebab-case). Only write FLOW tags for flows that appear in the finalized Riviere graph.

```bash
bun tools/tag-store.ts write --session $SESSION --db $DB_PATH --tag '{
  "target_type": "FLOW",
  "target_ref": "device-ingest-flow",
  "target_repo": "https://github.com/org/service-a",
  "kind": "FLOW",
  "value": "{\"flow_type\": \"user-operation\", \"entry_point\": \"POST /api/v1/devices/ingest\", \"entry_component\": \"device-data:handlers:api:device-ingest-handler\", \"steps\": [{\"component\": \"device-data:handlers:api:device-ingest-handler\", \"action\": \"receive\"}, {\"component\": \"device-data:use-cases:usecase:process-device-reading\", \"action\": \"process\"}, {\"component\": \"device-data:repository:domainop:save-reading\", \"action\": \"persist\"}, {\"component\": \"device-data:events:event:reading-processed\", \"action\": \"publish\"}], \"crosses_repos\": true, \"repos_involved\": [\"https://github.com/org/service-a\", \"https://github.com/org/service-b\"], \"description\": \"Ingest device reading, persist to DB, publish event for async notification\"}",
  "confidence": 0.80,
  "weight_class": "HUMAN",
  "source_tool": "riviere",
  "source_evidence": "Riviere graph finalized at .archimedes/sessions/<session>/riviere-final.json",
  "status": "VALIDATED",
  "session_id": "<session-id>"
}'
```

## Step 10: Write BOUNDARY Tags

Write one BOUNDARY tag for each service or domain boundary the flow crosses. Boundaries are inferred from the Riviere graph; they are MACHINE weight because they are derived from link metadata, not direct code evidence.

```bash
bun tools/tag-store.ts write --session $SESSION --db $DB_PATH --tag '{
  "target_type": "DOMAIN",
  "target_ref": "device-data-to-notifications-boundary",
  "target_repo": "https://github.com/org/service-a",
  "kind": "BOUNDARY",
  "value": "{\"boundary_type\": \"service\", \"protocol\": \"async-event\", \"inbound\": [\"device-data:use-cases:usecase:process-device-reading\"], \"outbound\": [\"notifications:handlers:eventhandler:reading-notification-handler\"], \"crosses_repos\": true, \"description\": \"Async boundary: device-data publishes ReadingProcessed; notifications service consumes it\"}",
  "confidence": 0.70,
  "weight_class": "MACHINE",
  "source_tool": "riviere",
  "source_evidence": "Derived from async links in Riviere graph",
  "status": "CANDIDATE",
  "session_id": "<session-id>"
}'
```

## riviere extract: Automated Component Scaffold (Optional)

When source code is available locally, `riviere extract` can draft components automatically from file analysis, bypassing manual `add-component` calls. Use this as a starting scaffold, then add links manually in Step 5.

```bash
# Extract components from source (requires extraction config)
riviere extract \
  --config .riviere/extract-config.json \
  --output $REPO/.archimedes/sessions/$SESSION/riviere-components.json \
  --stats

# Dry run: count components by domain without full output
riviere extract \
  --config .riviere/extract-config.json \
  --dry-run

# Extract from files changed in current branch only (PR workflow)
riviere extract \
  --config .riviere/extract-config.json \
  --pr \
  --output $REPO/.archimedes/sessions/$SESSION/pr-components.json

# Enrich existing draft components with additional extraction rules
riviere extract \
  --enrich $REPO/.archimedes/sessions/$SESSION/riviere-components.json \
  --config .riviere/extract-config.json
```

`riviere extract` does not write to the Riviere graph directly and there is no bulk import command. Use the JSON output as a scaffold: review each extracted component, confirm it has DEPENDENCY or PATTERN evidence in the tag store, then add it individually with `riviere builder add-component`. Components in the extract output that have no tag store evidence should be discarded, not added — they cannot be promoted to FLOW tags without backing evidence.

Use `riviere builder component-checklist --graph $GRAPH` after adding components to see which need links or enrichment before proceeding to Step 5.

## Guardrails

- **Never write FLOW tags without a Riviere schema backing them** — the graph is what elevates a FLOW tag to weight_class=HUMAN. Tag-store-only inference is MACHINE weight at best.
- **Never finalize a graph with >20% orphan components** — run `riviere query orphans --graph $GRAPH` and resolve before finalizing.
- **Never use `--source`/`--target` in the link command** — those flags do not exist. The correct flags are `--from`, `--to-domain`, `--to-module`, `--to-type`, and `--to-name`.
- **Never synthesize flows for which you have no DEPENDENCY or PATTERN evidence** — uncertainty must be explicit. Add a low-confidence note in the FLOW tag description rather than omitting the gap.
- **Never use `riviere query trace` with a component that was not added to the graph** — trace only works on component IDs that appear in `riviere query components --graph $GRAPH`.
- **Never assume `--link-type sync` for queue publishes or event bus emissions** — async boundaries must use `--link-type async` or the graph will misrepresent the coupling model.
- **Never combine multiple session repos into one graph without declaring all sources in `riviere builder init`** — undeclared repositories produce broken `--repository` references in `add-component`.
- **Never use `riviere builder enrich` to import `riviere extract` output** — `enrich` is for adding semantic metadata (state transitions, business rules, reads/modifies/emits) to a DomainOp component that is already in the graph. There is no bulk import command; add extracted components individually via `add-component`.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Component not found` on link | Typo in `--from` ID | Run `riviere query components --graph $GRAPH` and copy the exact ID |
| `riviere query trace` returns only entry point | No outgoing links | Verify links were created; re-run link steps |
| `riviere builder validate` reports errors | Broken references or missing domains | Follow the validation remediation table in Step 6 |
| FLOW tag rejected by tag store | Missing required fields | Confirm `entry_component` uses the full `domain:module:type:name` format |
| `riviere extract` produces 0 components | Config file missing or misconfigured | Check `.riviere/extract-config.json` exists; add `--allow-incomplete` to diagnose |
| Orphan count > 20% after linking | Coverage gaps: components with no DEPENDENCY evidence | Remove unlinked components or add a gap note; do not finalize until resolved |
