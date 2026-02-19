# Step 4: Link Components (Orchestrator)

## Objective

Trace operational connections between components to create the flow graph.

## Prerequisites

- Graph with extracted components from Step 3.
- Read `.riviere/config/linking-rules.md` for cross-domain patterns.
- Read `.riviere/config/domains.md` — use canonical domain names when resolving cross-repo links.

> **Single-repository codebases:** Follow `steps/connect-subagent.md` directly —
> you are both orchestrator and subagent. Use `.riviere/connect-checklist.md` as the
> checklist file, stage to `.riviere/work/link-staged-local.jsonl`, then replay staged
> commands with `bun tools/replay-staged-links.ts`.

## Generate Checklist

```bash
npx riviere builder component-checklist --output=".riviere/connect-checklist.md"
```

## Spawn Workers

**Trigger:** 2 or more repositories, or checklist contains more than 50 unchecked items.

**Partition strategy:** One worker per repository. Workers analyze links within their repo,
then write staged JSONL commands. Coordinator executes all write commands sequentially.

1. Split the master checklist into per-repository sub-checklists:

```bash
bun tools/split-checklist.ts --checklist .riviere/connect-checklist.md --prefix checklist
```

The tool reads repo roots from `meta-*.md` files, splits by exact path prefix match,
validates no empty splits, and writes per-repo files to `.riviere/work/checklist-{repo}.md`.

If the tool exits with code 2, some checklist items could not be matched to a repository —
check that path formats in the checklist match the repo roots in `meta-*.md`.

2. Spawn one worker per repository. Each receives `steps/connect-subagent.md` as its
   instruction set:

```text
AGENT INSTRUCTIONS: Read steps/connect-subagent.md and follow its instructions exactly.
REPOSITORY: {repository-name}
REPOSITORY ROOT: {local path}
CHECKLIST: .riviere/work/checklist-{repo}.md
```

> **Mandatory policy:** Treat all `riviere builder` write commands as concurrency-unsafe.
> Workers must stage commands only; coordinator serializes all writes.

## Wait and Merge

After all workers complete:

1. Merge sub-checklists back into the master checklist:

```bash
cat .riviere/work/checklist-*.md > .riviere/connect-checklist.md
```

2. Verify all items are checked before proceeding.

3. Replay staged link commands sequentially.

Run the replay tool (deterministic parser + sequential executor):

```bash
bun tools/replay-staged-links.ts
```

The tool reads `.riviere/work/link-staged-*.jsonl`, validates each JSON line, and executes
`link` / `link-http` / `link-external` sequentially. Report output:

```text
.riviere/work/link-replay-report.json
```

### Concrete Cross-Repository Example

Scenario:

- Source repo: `orders-api`
- Target repo: `payments-service`
- `orders-api` endpoint `POST /orders/{id}/pay` triggers payments `UseCase` `capture-payment`

Worker for `orders-api` stages this line in `.riviere/work/link-staged-orders-api.jsonl`:

```json
{"command":"link-http","path":"/orders/{id}/pay","method":"POST","toDomain":"payments","toModule":"checkout","toType":"UseCase","toName":"capture-payment","linkType":"sync"}
```

If source component ID is already known from checklist context, worker may stage a direct link:

```json
{"command":"link","from":"orders:api:api:post-orders-pay","toDomain":"payments","toModule":"checkout","toType":"UseCase","toName":"capture-payment","linkType":"sync"}
```

Coordinator then runs:

```bash
bun tools/replay-staged-links.ts
```

This applies the cross-repo link sequentially, exactly like in-repo links, using canonical
domain/module/type/name targeting (not repository names).

## Validate

After linking, check the validation rules in `.riviere/config/linking-rules.md`. List any
components that violate the rules so the user can review.

## Feedback

If user reports problems or missing elements, identify the root cause, update the relevant
config files, and re-run the affected step.

## Error Recovery

- **Worker sub-checklist is empty after split:** The repo root path in `metadata.md` may not match the file paths in the checklist. Check `.riviere/work/checklist-split-report.json` for unmatched lines and verify path formats.
- **Replay tool reports failures (exit code 2):** Open `.riviere/work/link-replay-report.json`, present malformed/failed lines to the user, and retry after fixes.
- **Checklist items remain unchecked after all workers complete:** Assign remaining items to a cleanup pass — spawn one additional worker with only the unchecked items as its checklist.

## Completion

Present link summary showing total links created (sync vs async).

**Step 4 complete.** Wait for user feedback before proceeding.

## Next Phase

Read `steps/annotate-orchestrator.md`
