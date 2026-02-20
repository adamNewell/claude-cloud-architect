# Step 6: Validate (Orchestrator)

## Objective

Check the graph for orphans and schema compliance.

## Prerequisites

- Graph with enriched components from Step 5.
- Read `.riviere/config/domains.md` — cross-domain orphan patterns may indicate a cross-repo link was missed.

> **Single-repository codebases:** Follow `steps/validate-subagent.md` for orphan
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
- All remaining orphans are diagnosed as intentionally orphaned (external consumers, standalone utilities), **or**
- 3 rounds completed without convergence — stop looping; remaining orphans likely indicate a structural issue with `linking-rules.md` patterns. Present persistent orphans to the user and recommend updating Step 4 patterns before retrying.

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

2. Spawn one worker per orphan type present. Each receives `steps/validate-subagent.md`
   as its instruction set:

```text
AGENT INSTRUCTIONS: Read steps/validate-subagent.md and follow its instructions exactly.
ORPHAN TYPE: {OrphanType}   (e.g., Event, UseCase, DomainOp, EventHandler)
```

## Error Recovery

- **`validate` command reports schema errors:** Fix schema errors completely before running orphan analysis. Do not proceed to orphan analysis with schema violations present.
- **Orphan fix loop does not converge after 3 rounds:** Stop looping. The remaining orphans likely indicate a structural issue with `linking-rules.md` patterns — present the persistent orphans to the user with a recommendation to update Step 4 patterns and re-run linking for affected domains only.
- **Worker subagent reports orphan type but provides no actionable fixes:** The orphan type may represent external consumers (events consumed by systems outside this graph). Ask the user to confirm before marking as intentionally orphaned.

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

Write the source hash so future runs can detect whether re-extraction is needed:

```bash
bun tools/check-hash.ts --project-root "$PROJECT_ROOT" --write
```

This records the current git HEAD SHA for every repository in `.riviere/config/source-hash.json`. On the next run, Setup will compare these SHAs against current HEAD and report FRESH or STALE.

**Graph extraction complete.**

## What You Now Have

Your extracted graph is at: `.riviere/[project-name]-[commit].json`

This file is a structured, queryable architecture graph containing:

- All discovered components (APIs, UseCases, DomainOps, Events, EventHandlers, UI)
- Operational links between them (sync HTTP calls and async event flows)
- Semantic enrichment on DomainOps (state changes, business rules)

### What to Do Next

| Goal                   | How                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| Query the graph        | Use `npx riviere query` — see `../../cookbook/riviere/cli.md` for query patterns                         |
| Visualize architecture | Upload to [living-architecture.dev](https://living-architecture.dev)                                     |
| Impact analysis        | Query which components are upstream/downstream of a given component                                      |
| Onboarding             | Share the graph file — new team members can navigate the system without reading code                     |
| Keep it current        | Re-run extraction (starting from Step 3) after major feature work; the graph is versioned by commit hash |
