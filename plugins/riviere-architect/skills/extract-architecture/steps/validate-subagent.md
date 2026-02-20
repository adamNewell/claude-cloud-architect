# Step 6 Subagent: Orphan Analysis

## Critical Constraints

**NEVER** mark an orphan as "intentionally orphaned" without checking for a cross-repo link that was missed in Step 4.

## Role

You are a subagent assigned to analyze orphan components of **one type**. You read the
graph and source files to diagnose root causes. You do not apply fixes — write findings
only. The orchestrator applies fixes and re-runs the loop.

## Scope

**Your assigned orphan type only.** Filter `.riviere/work/orphans.json` to your type.
Do not diagnose orphans of other types.

When your findings file is written, report completion to the orchestrator.

## Prerequisites

Read these files before starting:

- `.riviere/work/orphans.json` — full orphan list; filter to your assigned type
- `.riviere/config/domains.json` — canonical domain names for cross-repo mismatch detection

## Process

For each orphan of your assigned type:

1. Read the component's source file at the location recorded in the graph
2. Determine root cause — one of:

   | Root Cause                       | Signals                                                                              |
   | -------------------------------- | ------------------------------------------------------------------------------------ |
   | **Missing link**                 | Code clearly calls another component but no link exists in the graph                 |
   | **Missing component**            | A matching component exists in the source but wasn't extracted in Step 3             |
   | **Wrong domain / name mismatch** | Component name or domain doesn't match the canonical name in `domains.json`           |
   | **Intentionally orphaned**       | External consumer, standalone utility, or entry point with no inbound links expected |

3. For missing links: identify the source component ID and the exact CLI command needed:

   ```bash
   npx riviere builder link \
     --from "{source-id}" \
     --to-domain {domain} --to-module {module} --to-type {Type} --to-name "{name}" \
     --link-type sync|async
   ```

4. Write one entry per orphan to your findings file

## Output Format

Write findings to `.riviere/work/orphan-analysis-{type}.jsonl`.

Each line is a JSON object with one entry per orphan:

```jsonl
{"componentId":"orders:domain:domainop:order.begin","diagnosis":"missing_link","rootCause":"UseCase calls Order.begin() but link not staged","action":"link","command":"npx riviere builder link --from \"orders:app:usecase:place-order\" --to-domain orders --to-module checkout --to-type DomainOp --to-name \"order.begin\" --link-type sync"}
{"componentId":"notifications:handlers:eventhandler:on-order-shipped","diagnosis":"intentional","rootCause":"External logistics system outside graph scope","action":"accept"}
{"componentId":"orders:domain:domainop:order.cancel","diagnosis":"missing_component","rootCause":"CancelOrderUseCase exists in source but was not extracted in Step 3","action":"extract","command":"npx riviere builder add-component --type UseCase --domain orders --module checkout --name cancel-order"}
{"componentId":"inventory:app:usecase:sync-stock","diagnosis":"name_mismatch","rootCause":"Component uses 'stock' but domain canonical name is 'inventory'","action":"rename","command":"npx riviere builder rename --id \"inventory:app:usecase:sync-stock\" --new-name \"sync-inventory\""}
```

**Diagnosis values:** `missing_link` | `missing_component` | `name_mismatch` | `intentional`

**Action values:** `link` | `extract` | `rename` | `accept`

## Completion

Findings file written. Your work is done — report back to the orchestrator.

**Do not apply fixes.** Do not read further phase files. Do not proceed further.
