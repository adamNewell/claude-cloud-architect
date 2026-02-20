# Step 5: Enrich Components (Orchestrator)

## Objective

Add semantic information to DomainOps — state changes, business rules, and operation behavior.

## Record Progress

```bash
bun tools/detect-phase.ts --project-root "$PROJECT_ROOT" --step annotate --status started
```

## Prerequisites

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
bun tools/split-checklist.ts --project-root "$PROJECT_ROOT" --checklist "$PROJECT_ROOT/.riviere/step-5-checklist.md" --prefix enrich
```

The tool reads repo roots from `meta-*.md` files, splits by exact path prefix match,
and writes per-repo files to `.riviere/work/enrich-{repo}.md`.

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

2. Replay staged enrichment commands sequentially:

```bash
bun tools/replay-staged-enrichments.ts --project-root "$PROJECT_ROOT"
```

The tool reads `.riviere/work/annotate-staged-*.jsonl`, validates each JSON line, and executes
`enrich` sequentially. Report output:

```text
.riviere/work/enrich-replay-report.json
```

3. Verify all checklist items are checked.

## Feedback

If user reports problems or missing elements, identify the root cause, update the relevant
config files, and re-run the affected step.

## Error Recovery

- **`enrich` CLI call fails:** Do NOT retry in parallel. Retry sequentially, one at a time. Log any that fail twice and present to user.
- **Worker staged JSONL contains malformed JSON:** Skip the malformed line, log it, and continue. After all workers complete, present malformed lines to user for manual review.
- **DomainOp checklist items remain unchecked after merge:** Re-inspect the source file for that component — the subagent may have been unable to locate business logic. Flag as `[NEEDS-REVIEW]` rather than leaving blank.

## Record Completion

```bash
bun tools/detect-phase.ts --project-root "$PROJECT_ROOT" --step annotate --status completed
```

## Completion

Present enrichment summary showing how many DomainOps were enriched.

**Step 5 complete.** Wait for user feedback before proceeding.

## Next Phase

Read `steps/validate-orchestrator.md`
