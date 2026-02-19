---
model: opus
description: Full architecture deconstruction using the riviere-architect workflow. Runs all 6 phases — wiki ingestion, domain mapping, rule definition, component extraction, linking, enrichment, and validation — to produce a complete architecture graph. USE WHEN documenting an existing codebase, extracting architecture for a new team member, creating architecture decision records, or understanding a system you didn't build.
argument-hint: <repo-path-or-paths...> [--skip-wiki] [--skip-enrich] [--quick-validate] [--wiki-path=<path>]
---

# Arch Deconstruct

## Purpose

Run the complete riviere-architect 6-phase workflow against one or more repositories. Spawns orchestrator and subagent instances per phase, following the orchestrator-subagent coordination pattern defined in the phase reference documents. Produces a fully validated architecture graph in `.riviere/{project}-{commit}.json`.

**This command is the Layer 3 entry point for the riviere-architect skill.** It does not re-implement the workflow — it drives the workflow defined in `skills/riviere-architect/SKILL.md` and its phase reference documents.

## Variables

```
REPO_PATHS:    from $ARGUMENTS — space-separated repo paths. Required.
SKIP_WIKI:     from $ARGUMENTS — if `--skip-wiki` present, skip Phases 0A and 0B. Default: false.
WIKI_PATH:     from $ARGUMENTS — `--wiki-path=<path>` overrides wiki generation; runs only Phase 0B. Default: none.
SKIP_ENRICH:   from $ARGUMENTS — if `--skip-enrich` present, skip Phase 5. Default: false (enrichment is slow).
QUICK_VALIDATE: from $ARGUMENTS — if `--quick-validate` present, skip orphan loop in Phase 6; single pass only.
MULTI_REPO:    true if more than one REPO_PATH provided.
RUN_ID:        8-char UUID generated at start.
```

## Codebase Structure

```
.riviere/
├── config/                            ← Phase 1-2 artifacts (domains, rules)
├── work/                              ← Subagent staging area (JSONL, per-repo markdown)
└── {project}-{commit}.json            ← The final graph
```

## Instructions

- Read the skill and all phase reference documents BEFORE spawning any agents
- Meta-prompt engineering: extract the exact variables, output formats, and constraints from each phase document before writing agent prompts
- Phases are SEQUENTIAL — never start Phase N+1 until Phase N's orchestrator merge is complete
- Respect concurrency constraints:
  - Phase 3: subagents write JSONL only; orchestrator serializes CLI calls
  - **Phase 5: NO concurrent `enrich` CLI calls; mandatory JSONL staging — concurrent enrich calls corrupt the graph (45–60% data loss)**
  - Phase 4: concurrent linking IS safe
- After each phase, validate artifacts exist before continuing
- The validate-graph.ts hook fires automatically after every `riviere builder` command — if it exits with code 2, fix errors before the next phase

## Workflow

### Step 0: Load Skill and Phase Documents

Read these files before anything else:

1. `skills/riviere-architect/SKILL.md` — workflow overview and variables
2. `skills/riviere-architect/references/phase-0a.md` (if not SKIP_WIKI)
3. `skills/riviere-architect/references/phase-0b.md` (if not SKIP_WIKI and not WIKI_PATH)
4. `skills/riviere-architect/references/phase-1-orchestrator.md`
5. `skills/riviere-architect/references/phase-2-orchestrator.md`
6. `skills/riviere-architect/references/phase-3-orchestrator.md`
7. `skills/riviere-architect/references/phase-4-orchestrator.md`
8. `skills/riviere-architect/references/phase-5-orchestrator.md` (if not SKIP_ENRICH)
9. `skills/riviere-architect/references/phase-6-orchestrator.md`

Extract from each document:

- Required input artifacts
- Subagent spawn strategy (how many, what scope)
- Output artifact paths
- Orchestrator merge steps
- User checkpoint locations

Announce readiness:

```
arch-deconstruct ready.
Repos: {list}
Phases: {list based on flags}
Run ID: {RUN_ID}
Starting Phase 0...
```

### Step 1: Phase 0 — Wiki Setup (conditional)

**If SKIP_WIKI:** Skip to Step 2.

**If WIKI_PATH provided:**

- Skip Phase 0A
- Run Phase 0B only: `bun skills/riviere-architect/tools/ingest-wiki.ts {WIKI_PATH}`
- Confirm qmd embeddings generated

**Otherwise (full Phase 0):**

- Phase 0A: Follow `phase-0a.md` — guide user through DeepWiki setup for each repo
- Phase 0B: Run `ingest-wiki.ts` for each generated wiki

**Checkpoint:** Confirm qmd is responding: `qmd query "main application domain" --json`

### Step 2: Phase 1 — Understand Codebase

Spawn one subagent per repo (parallel if MULTI_REPO). Each subagent follows `phase-1-subagent.md`.

Agent prompt template (fill in per-repo values):

```
You are a Phase 1 subagent for the riviere-architect workflow.

Read this file for your complete instructions:
skills/riviere-architect/references/phase-1-subagent.md

Your assigned repository: {REPO_PATH}
Your output files:
- .riviere/work/meta-{repo-name}.md
- .riviere/work/domains-{repo-name}.md

Use qmd if available (run `qmd query "..." --json` to query wiki).
When complete, report: PHASE_1_DONE: {repo-name} | {N} domains discovered | Files written.
```

Wait for all Phase 1 subagents to complete.

**Orchestrator merge** (follow `phase-1-orchestrator.md` merge steps):

1. Consolidate domain discoveries → `.riviere/config/domains.md`
2. Merge metadata → `.riviere/config/metadata.md`
3. **USER CHECKPOINT:** Present domain list. Get approval before proceeding.

### Step 3: Phase 2 — Define Extraction Rules

Spawn one subagent per (component type × repo) combination. Types: API, UseCase, DomainOp, Event, EventHandler, UI, plus any custom types.

Each subagent follows `phase-2-subagent.md`.

Agent prompt template:

```
You are a Phase 2 subagent for the riviere-architect workflow.

Read: skills/riviere-architect/references/phase-2-subagent.md

Your assigned scope:
- Repository: {REPO_PATH}
- Component type: {TYPE}
- Output file: .riviere/work/rules-{repo}-{type}.md

Inputs available:
- .riviere/config/domains.md (canonical domains)
- .riviere/config/metadata.md (frameworks, conventions)

When complete, report: PHASE_2_DONE: {repo-name}:{type} | {N} patterns found | File written.
```

Wait for all Phase 2 subagents to complete.

**Orchestrator merge** (follow `phase-2-orchestrator.md` merge steps):

1. Consolidate custom type proposals — ask user to accept/reject each
2. Merge extraction rules → `.riviere/config/component-definitions.md`
3. Merge linking patterns → `.riviere/config/linking-rules.md`
4. **USER CHECKPOINT:** Present rules for review.

### Step 4: Phase 3 — Extract Components

**Initialize graph first:**

```bash
bun skills/riviere-architect/tools/init-graph.ts
```

Confirm it exits 0 and `riviere builder component-summary` returns without error.

Spawn one subagent per repo (JSONL staging only — no CLI calls by subagents):

Agent prompt template:

```
You are a Phase 3 subagent for the riviere-architect workflow.

Read: skills/riviere-architect/references/phase-3-subagent.md

Your assigned repository: {REPO_PATH}
Extraction rules: .riviere/config/component-definitions.md
Domain map: .riviere/config/domains.md
Metadata: .riviere/config/metadata.md
Output file: .riviere/work/extract-{repo-name}.jsonl

CRITICAL: Write staged JSONL only. Do NOT call riviere builder add-component directly.
When complete, report: PHASE_3_DONE: {repo-name} | {N} components staged | File written.
```

Wait for all Phase 3 subagents to complete.

**Orchestrator serialization** (follow `phase-3-orchestrator.md`):

1. Read each `extract-{repo}.jsonl`
2. For each line, call `riviere builder add-component {args}` sequentially
3. Run `riviere builder component-summary` — validate counts make sense
4. Check validate-graph.ts output (auto-fires after each CLI call)

### Step 5: Phase 4 — Link Components

**Pre-populate link candidates first:**

```bash
bun skills/riviere-architect/tools/generate-link-candidates.ts {REPO_PATHS...}
```

This reads all `extract-*.jsonl` files from Phase 3 and produces `.riviere/work/link-candidates.jsonl` — high-confidence links derived from:
- `subscribedEvents` fields on EventHandlers (zero source reading needed)
- Named component imports found in caller source files

**Apply pre-populated candidates:**

Read `.riviere/work/link-candidates.jsonl`. For each entry call:
```bash
riviere builder link --from {from} --to {to} --link-type {linkType}
```
sequentially. These are pre-validated HIGH confidence links — apply them without additional source verification.

**Generate checklist for remaining work:**

```bash
riviere builder component-checklist > .riviere/work/step-4-checklist.md
```

Split the checklist by repo. Spawn one subagent per repo for the remainder (concurrent linking is safe):

Agent prompt template:

```
You are a Phase 4 subagent for the riviere-architect workflow.

Read: skills/riviere-architect/references/phase-4-subagent.md

Your assigned repository: {REPO_PATH}
Your checklist: {REPO_SECTION of .riviere/work/step-4-checklist.md}
Linking rules: .riviere/config/linking-rules.md

Note: High-confidence links were pre-applied from link-candidates.jsonl before you
were spawned. Focus on checklist items that remain unchecked — these are the
ambiguous cases (HTTP cross-service, DI container patterns, external links) that
require your judgment.

You MAY call riviere builder link/link-http/link-external directly.
Mark each checklist item [x] when linked.
When complete, report: PHASE_4_DONE: {repo-name} | {N} links created | Checklist updated.
```

Wait for all Phase 4 subagents to complete.

**Orchestrator:** Verify checklist completion. Run validate-graph.ts explicitly if no CLI calls fired the hook.

### Step 6: Phase 5 — Enrich DomainOps (conditional)

**If SKIP_ENRICH:** Skip to Step 7.

Generate enrichment checklist. Spawn one subagent per repo for JSONL staging.

Agent prompt template:

```
You are a Phase 5 subagent for the riviere-architect workflow.

Read: skills/riviere-architect/references/phase-5-subagent.md

Your assigned repository: {REPO_PATH}
Your output file: .riviere/work/enrich-staged-{repo-name}.jsonl

CRITICAL: Write staged JSONL only. NEVER call riviere builder enrich directly.
Concurrent enrich calls corrupt the graph (45–60% data loss).
When complete, report: PHASE_5_DONE: {repo-name} | {N} enrichments staged | File written.
```

Wait for all Phase 5 subagents to complete.

**Orchestrator serialization** (follow `phase-5-orchestrator.md`):

1. Read each `enrich-staged-{repo}.jsonl`
2. Call `riviere builder enrich {args}` **sequentially** for each line (NEVER concurrent)
3. Validate enrichment quality via validate-graph.ts

### Step 7: Phase 6 — Validate & Finalize

Follow `phase-6-orchestrator.md` exactly:

1. `riviere builder validate` — schema check
2. `riviere builder check-consistency --json > .riviere/work/orphans.json`
3. Count actionable orphans. If > 20 and not QUICK_VALIDATE:
   - Group orphans by type
   - Spawn one phase-6-subagent per type (read `phase-6-subagent.md`)
   - Wait for all subagents to write their analysis files
   - Read all `.riviere/work/orphan-analysis-{type}.md` files
   - Apply fixes from analysis files
   - Loop: repeat steps 1–3 until actionable orphan count reaches 0 or plateaus
4. `riviere builder finalize`

### Step 8: Report

Present the final summary:

```
# arch-deconstruct Complete

**Run ID:** {RUN_ID}
**Duration:** {elapsed}
**Repos:** {list}

## Graph Statistics
| Metric              | Count |
|---------------------|-------|
| Domains             | N     |
| APIs                | N     |
| UseCases            | N     |
| DomainOps           | N     |
| Events              | N     |
| EventHandlers       | N     |
| UI Components       | N     |
| Custom Types        | N     |
| Total Links         | N     |
| Orphans (remaining) | N     |

## Output
Graph: .riviere/{project}-{commit}.json

## Query Examples
```bash
riviere query entry-points
riviere query trace {component-id}
riviere query components --type UseCase --domain {domain}
```

```

## Report

See Step 8 above.

## Examples

### Single repo, skip wiki
```

/arch-deconstruct /projects/my-api --skip-wiki

```

### Multi-repo with existing wiki
```

/arch-deconstruct /projects/api /projects/frontend --wiki-path ./docs/wiki

```

### Full run (will ask about DeepWiki setup)
```

/arch-deconstruct /projects/my-api

```

### Quick with no enrichment or wiki
```

/arch-deconstruct /projects/legacy --skip-wiki --skip-enrich --quick-validate

```
