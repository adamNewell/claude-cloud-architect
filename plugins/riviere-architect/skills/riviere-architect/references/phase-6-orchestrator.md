# Step 6: Validate (Orchestrator)

## Objective

Check the graph for orphans and schema compliance.

## Prerequisites

- **Do not use plan mode.** Execute directly.
- Graph with enriched components from Step 5.
- Read `.riviere/config/domains.md` — cross-domain orphan patterns may indicate a cross-repo link was missed.

> **Single-repository codebases:** Follow `references/phase-6-subagent.md` for orphan
> analysis when the orphan count exceeds 20. For smaller counts, run the orphan loop
> directly as described below.

## 1. Validate Schema

```bash
npx riviere builder validate
```

Full JSON Schema validation. Fix any errors before proceeding to orphan analysis.

## 2. Check Orphans (Loop Until Resolved)

```bash
npx riviere builder check-consistency --json
```

**Loop condition:** Repeat the check → analyze → fix cycle until one of:

- Zero orphans remain, **or**
- All remaining orphans are diagnosed as intentionally orphaned (external consumers, standalone utilities)

**Common causes:**

- **Orphan Events**: DomainOp not publishing, or EventHandler not subscribing
- **Orphan EventHandlers**: Event not being published, or event name mismatch
- **Orphan DomainOps**: UseCase not calling the operation
- **Orphan UseCases**: API not invoking the use case

Pay special attention to orphan UseCases and DomainOps — these are not entry points or exit points so it's unusual for them to be orphans.

A high orphan count (>20%) usually indicates systematic linking failure in Step 4 — check
`linking-rules.md` patterns before fixing individual orphans.

## Spawn Workers

**Trigger:** Orphan count exceeds 20. Spawn one worker per orphan type.

1. Save orphan output:

```bash
mkdir -p .riviere/work/
npx riviere builder check-consistency --json > .riviere/work/orphans.json
```

2. Spawn one worker per orphan type present. Each receives `references/phase-6-subagent.md`
   as its instruction set:

```text
AGENT INSTRUCTIONS: Read references/phase-6-subagent.md and follow its instructions exactly.
ORPHAN TYPE: {OrphanType}   (e.g., Event, UseCase, DomainOp, EventHandler)
```

## Orphan Fix Loop

After workers complete (or after direct analysis for small counts):

1. Read all `.riviere/work/orphan-analysis-{type}.md` files
2. Tally actionable orphans (exclude accepted intentional ones). If count = 0, exit loop
3. Apply corrections:
   - **Missing link** → add the link (re-run affected portion of Step 4)
   - **Missing component** → update `.riviere/config/component-definitions.md`, re-run Step 3 for the affected repository only
   - **Wrong domain / name mismatch** → fix the component name or domain
4. **Return to step 1 of this loop** — re-run `check-consistency --json` (spawning workers again if count > 20) and repeat until actionable orphan count reaches 0

## Completion

Present final stats:

- Total components by type
- Total links (sync vs async)
- Domains covered

**Graph extraction complete.**
