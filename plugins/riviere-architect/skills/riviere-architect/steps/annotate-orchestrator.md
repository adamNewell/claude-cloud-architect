# Step 5: Enrich Components (Orchestrator)

## Objective

Add semantic information to DomainOps — state changes, business rules, and operation behavior.

## Prerequisites

- **Do not use plan mode.** Execute directly.
- Graph with linked components from Step 4.

> **Single-repository codebases:** Follow `steps/annotate-subagent.md` directly —
> you are both orchestrator and subagent. Use `.riviere/step-5-checklist.md` as the
> checklist file. Call the enrich CLI directly.

## Generate Checklist

```bash
npx riviere builder component-checklist --type=DomainOp --output=".riviere/step-5-checklist.md"
```

## Spawn Workers

**Trigger:** 2 or more repositories, or DomainOp checklist contains more than 30 items.

**Partition strategy:** One worker per repository — each worker reads source files and
writes staged enrichment data. The coordinator serializes all `enrich` CLI calls.

**⚠️ Concurrent `enrich` calls corrupt the graph.** Testing (20 DomainOps, 3 rounds)
showed 45–60% data loss per round when calls run simultaneously. Workers must NOT call
`enrich` directly — they write staged output; the coordinator runs enrich sequentially.

1. Split the DomainOp checklist into per-repository sub-checklists:

```bash
mkdir -p .riviere/work/
grep "orders-service/" .riviere/step-5-checklist.md > .riviere/work/enrich-orders-service.md
grep "inventory-service/" .riviere/step-5-checklist.md > .riviere/work/enrich-inventory-service.md
# repeat for each repository
```

2. Spawn one worker per repository. Each receives `steps/annotate-subagent.md` as its
   instruction set:

```text
AGENT INSTRUCTIONS: Read steps/annotate-subagent.md and follow its instructions exactly.
REPOSITORY: {repository-name}
REPOSITORY ROOT: {local path}
CHECKLIST: .riviere/work/enrich-{repo}.md
```

## Wait and Merge

After all workers complete:

1. Merge sub-checklists back into the master checklist:

```bash
cat .riviere/work/enrich-*.md > .riviere/step-5-checklist.md
```

2. Read all `.riviere/work/annotate-staged-{repo}.jsonl` files. For each line, run the
   `enrich` call sequentially:

```bash
# Each staged line is a JSON object with the full enrich args
# Run one at a time — do NOT parallelize
```

3. Verify all checklist items are checked.

## Feedback

If user reports problems or missing elements, identify the root cause, update the relevant
config files, and re-run the affected step.

## Completion

Present enrichment summary showing how many DomainOps were enriched.

**Step 5 complete.** Wait for user feedback before proceeding.

## Next Phase

Read `steps/validate-orchestrator.md`
