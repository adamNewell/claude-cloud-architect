# Step 4: Link Components (Orchestrator)

## Objective

Trace operational connections between components to create the flow graph.

## Prerequisites

- **Do not use plan mode.** Execute directly.
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

1. Split the master checklist into per-repository sub-checklists by matching source file
   paths to their repository root:

```bash
mkdir -p .riviere/work/
# Split checklist by repository — one file per repo
# For each repository listed in .riviere/config/metadata.md, extract its entries:
while IFS= read -r repo_path; do
  repo_name=$(basename "$repo_path")
  grep "$repo_path" .riviere/connect-checklist.md > ".riviere/work/checklist-${repo_name}.md"
done < <(grep -oP '(?<=Root: ).*' .riviere/work/meta-*.md)

# Verify: each per-repo checklist should be non-empty
# If a checklist is empty, check that the repo root path in metadata.md matches
# the file paths recorded during extract step
```

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

- **Worker sub-checklist is empty after grep-split:** The repo root path in `metadata.md` may not match the file paths in the checklist. Open `.riviere/connect-checklist.md` and inspect actual path prefixes — update the grep pattern accordingly.
- **Replay tool reports failures (exit code 2):** Open `.riviere/work/link-replay-report.json`, present malformed/failed lines to the user, and retry after fixes.
- **Checklist items remain unchecked after all workers complete:** Assign remaining items to a cleanup pass — spawn one additional worker with only the unchecked items as its checklist.

## Completion

Present link summary showing total links created (sync vs async).

**Step 4 complete.** Wait for user feedback before proceeding.

## Next Phase

Read `steps/annotate-orchestrator.md`
