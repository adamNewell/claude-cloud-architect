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
WIKI_PATH:     from $ARGUMENTS — `--wiki-path=<path>` overrides wiki generation; runs only Wiki Index. Default: none.
SKIP_ENRICH:   from $ARGUMENTS — if `--skip-enrich` present, skip Annotate. Default: false (enrichment is slow).
QUICK_VALIDATE: from $ARGUMENTS — if `--quick-validate` present, skip orphan loop in Validate; single pass only.
MULTI_REPO:    true if more than one REPO_PATH provided.
RUN_ID:        8-char UUID generated at start.
```

## Codebase Structure

```
.riviere/
├── config/                            ← Explore-2 artifacts (domains, rules)
├── work/                              ← Subagent staging area (JSONL, per-repo markdown)
└── {project}-{commit}.json            ← The final graph
```

## Instructions

- Steps are self-chaining — each step file tells you what to load next. Do not pre-read all documents.
- Phases are SEQUENTIAL — never start Phase N+1 until Phase N's orchestrator merge is complete
- Respect concurrency constraints:
  - Extract: subagents write JSONL only; orchestrator serializes CLI calls
  - Connect: subagents stage link commands only; orchestrator serializes CLI calls
  - **Annotate: NO concurrent `enrich` CLI calls; mandatory JSONL staging — concurrent enrich calls corrupt the graph (45–60% data loss)**
- After each phase, validate artifacts exist before continuing
- The validate-graph.ts hook fires automatically after every `riviere builder` command — if it exits with code 2, fix errors before the next phase

## Workflow

### Step 0: Load Skill Overview

Read `skills/riviere-architect/SKILL.md` for workflow overview, variables, and tool reference. **Do not** pre-read all phase documents — steps are self-chaining. Each step file tells you what to load next, keeping context focused on the current phase.

Announce readiness:

```
arch-deconstruct ready.
Repos: {list}
Phases: {list based on flags}
Run ID: {RUN_ID}
Starting wiki setup...
```

### Step 1: Wiki Setup (conditional)

**If SKIP_WIKI:** Skip to Step 1.5.

**If WIKI_PATH provided:** Skip Wiki Build. Follow `steps/wiki-index.md` only with the provided path.

**Otherwise:** Follow `steps/wiki-build.md`, then `steps/wiki-index.md`.

### Step 2: Explore — Understand Codebase

Follow `steps/explore-orchestrator.md`.

Pass MULTI_REPO flag so the orchestrator knows whether to spawn subagents or act as subagent directly.

### Step 3: Configure — Define Extraction Rules

Follow `steps/configure-orchestrator.md`.

### Step 4: Extract — Extract Components

Follow `steps/extract-orchestrator.md`.

### Step 5: Connect — Link Components

Follow `steps/connect-orchestrator.md`.

### Step 6: Annotate — Enrich DomainOps (conditional)

**If SKIP_ENRICH:** Skip to Step 7.

Follow `steps/annotate-orchestrator.md`.

### Step 7: Validate — Validate & Finalize

Follow `steps/validate-orchestrator.md`. If QUICK_VALIDATE, skip the orphan analysis loop — single validation pass only.

### Step 8: Report

Present the final summary:

```
# arch-deconstruct Complete

**Run ID:** {RUN_ID}
**Duration:** {elapsed}
**Repos:** {list}

## Graph Statistics
| Metric              | Count |
| ------------------- | ----- |
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
