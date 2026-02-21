---
model: opus
description: Full architecture deconstruction using the riviere-architect workflow. Runs all 8 phases — wiki ingestion, classification, domain mapping, rule definition, component extraction, linking, enrichment, tracing, and validation — to produce a complete architecture graph. USE WHEN documenting an existing codebase, extracting architecture for a new team member, creating architecture decision records, or understanding a system you didn't build.
argument-hint: <repo-path-or-paths...> [--skip-wiki] [--skip-enrich] [--quick-validate] [--wiki-path=<path>]
---

# Arch Deconstruct

## Purpose

Run the complete riviere-architect 8-phase workflow against one or more repositories. Each phase runs in a fresh agent that receives only a handoff file and step instructions — no conversation history crosses step boundaries. Produces a fully validated architecture graph in `.riviere/{project}-{commit}.json`.

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

> **Include ALL repositories.** REPO_PATHS must include every locally-cloned repo that is
> part of this system — application services, shared libraries, IaC stacks (CDK, Terraform),
> frontend component libraries, and dev tooling. Omitting repos produces an incomplete
> dependency graph. If a repo is not cloned locally, note it as absent but do not silently
> exclude repos that ARE present.

## Codebase Structure

```
.riviere/
├── config/                            ← Explore-2 artifacts (domains, rules)
├── work/                              ← Subagent staging area (JSONL, per-repo markdown)
│   ├── handoff-classify.json          ← Handoff context from classify step
│   ├── handoff-explore.json           ← Handoff context from explore step
│   ├── handoff-configure.json         ← Handoff context from configure step
│   ├── handoff-extract.json           ← Handoff context from extract step
│   ├── handoff-connect.json           ← Handoff context from connect step
│   ├── handoff-annotate.json          ← Handoff context from annotate step
│   ├── handoff-trace.json             ← Handoff context from trace step
│   └── handoff-validate.json          ← Handoff context from validate step
└── {project}-{commit}.json            ← The final graph
```

## Instructions

- Steps are isolated — each runs in a fresh agent with only handoff context
- Phases are SEQUENTIAL — never start Phase N+1 until Phase N's handoff file is produced
- Write gate: subagents produce JSONL only (no Bash). Orchestrators replay via TypeScript tools.
- After each phase, validate the handoff file exists before spawning the next agent
- The validate-graph.ts hook fires automatically after every `riviere builder` command — if it exits with code 2, fix errors before the next phase

## Workflow

### Step 0: Load Skill Overview

Read `skills/riviere-architect/SKILL.md` for workflow overview, variables, and tool reference.

Announce readiness:

```
arch-deconstruct ready.
Repos: {list}
Phases: {list based on flags}
Run ID: {RUN_ID}
Starting classification...
```

### Per-Step Dispatch Pattern

Each step is executed by a **fresh agent** that receives only:

1. The handoff file from the previous step (`handoff-{previous-step}.json`)
2. The step's orchestrator instructions (`steps/{step}-orchestrator.md`)
3. Core variables (PROJECT_ROOT, REPO_PATHS, flags)

**No conversation history crosses step boundaries.** This keeps each step's context focused
and prevents context window exhaustion on large codebases.

#### Dispatch Loop

For each step in the pipeline:

1. **Check handoff**: Read `.riviere/work/handoff-{previous-step}.json` (skip for first step)
2. **Spawn fresh agent** with instructions:

   ```text
   AGENT INSTRUCTIONS: Read {step-orchestrator-file} and follow its instructions exactly.
   PROJECT_ROOT: {PROJECT_ROOT}
   REPO_PATHS: {space-separated paths}
   HANDOFF: Read .riviere/work/handoff-{previous-step}.json for context from the previous step.
   FLAGS: {relevant flags}
   ```

3. **Wait for agent completion**
4. **Verify handoff produced**: Check `.riviere/work/handoff-{step}.json` exists
5. **User confirmation gate**: Present step summary, wait for approval before next step
6. **Continue to next step** or stop if user requests

#### Step Sequence

| Order | Step       | Orchestrator File                         | Condition            |
| ----- | ---------- | ----------------------------------------- | -------------------- |
| 0     | Wiki Setup | steps/wiki-build.md + steps/wiki-index.md | Unless --skip-wiki   |
| 1     | Classify   | steps/classify-orchestrator.md            | Always               |
| 2     | Explore    | steps/explore-orchestrator.md             | Always               |
| 3     | Configure  | steps/configure-orchestrator.md           | Always               |
| 4     | Extract    | steps/extract-orchestrator.md             | Always               |
| 5     | Connect    | steps/connect-orchestrator.md             | Always               |
| 6     | Annotate   | steps/annotate-orchestrator.md            | Unless --skip-enrich |
| 7     | Trace      | steps/trace-orchestrator.md               | Always               |
| 8     | Validate   | steps/validate-orchestrator.md            | Always               |

### Step 9: Report

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
