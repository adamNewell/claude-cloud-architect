---
model: opus
description: Jump to any extraction step by number or name. USE WHEN resuming the pipeline after context reset, skipping to a specific step, or re-running a step. Works cold-start — recovers PROJECT_ROOT and REPO_PATHS from .riviere/ on disk. Examples: "/arch-step 2", "/arch-step explore", "/arch-step extract", "/arch-step validate".
argument-hint: <step-number-or-name> --project-root <path>
---

# Arch Step (Pipeline Short Circuit)

Jump directly to any riviere-architect pipeline step without running from the beginning.
Recovers all pipeline state (PROJECT_ROOT, REPO_PATHS, completed steps) from `.riviere/`
artifacts on disk — no conversation history required.

**This is a resume tool.** It requires `.riviere/` to exist from a prior pipeline run.
To start a new pipeline, use `/arch-deconstruct` instead.

## Variables

```
STEP_ARG:      from $ARGUMENTS — step number (1-8) or step name. Required.
PROJECT_ROOT:  from --project-root in $ARGUMENTS. Required — see instructions.
```

## Step Map

| Number | Name      | Orchestrator File               |
| ------ | --------- | ------------------------------- |
| 1      | classify  | steps/classify-orchestrator.md  |
| 2      | explore   | steps/explore-orchestrator.md   |
| 3      | configure | steps/configure-orchestrator.md |
| 4      | extract   | steps/extract-orchestrator.md   |
| 5      | connect   | steps/connect-orchestrator.md   |
| 6      | annotate  | steps/annotate-orchestrator.md  |
| 7      | trace     | steps/trace-orchestrator.md     |
| 8      | validate  | steps/validate-orchestrator.md  |

## Instructions

### 1. Resolve Step

Parse STEP_ARG:

- Number ("1" through "8") → map via Step Map above
- Name ("classify", "explore", "configure", "extract", "connect", "annotate", "trace", "validate") → direct match
- Unrecognized → print the Step Map and stop

### 2. Recover Pipeline State

Parse `--project-root <path>` from ARGUMENTS. If not provided, stop and report:

> "`--project-root` is required. Example: `/arch-step 4 --project-root /path/to/project`"

Use the Read tool to read `{PROJECT_ROOT}/.riviere/work/progress.json`.

If the file does not exist, stop and report:

> "No `.riviere/` state found at `{PROJECT_ROOT}`. Run `/arch-deconstruct <repo-paths>` to start a new pipeline, or verify `--project-root` points to the correct directory."

From the JSON contents, extract:

| Field            | Use                                                       |
| ---------------- | --------------------------------------------------------- |
| `projectRoot`    | The PROJECT_ROOT for all subsequent commands              |
| `repoRoots`      | Map of `{repoName: repoPath}` — values become REPO_PATHS |
| `completedSteps` | Steps already finished                                    |
| `nextStep`       | Where the pipeline currently expects to continue          |

If `repoRoots` is empty (possible if the requested step is classify and explore hasn't run yet), REPO_PATHS will be recovered from the preceding handoff file (see step 3).

### 3. Load Handoff Context

Use the Read tool to load the handoff file from the step immediately preceding the requested step:

| Requested Step | Handoff to Read                                           |
| -------------- | --------------------------------------------------------- |
| classify (1)   | None — use state from progress.json only                  |
| explore (2)    | `{PROJECT_ROOT}/.riviere/work/handoff-classify.json`      |
| configure (3)  | `{PROJECT_ROOT}/.riviere/work/handoff-explore.json`       |
| extract (4)    | `{PROJECT_ROOT}/.riviere/work/handoff-configure.json`     |
| connect (5)    | `{PROJECT_ROOT}/.riviere/work/handoff-extract.json`       |
| annotate (6)   | `{PROJECT_ROOT}/.riviere/work/handoff-connect.json`       |
| trace (7)      | `{PROJECT_ROOT}/.riviere/work/handoff-annotate.json`      |
| validate (8)   | `{PROJECT_ROOT}/.riviere/work/handoff-trace.json`         |

If the handoff file exists: merge its `repoRoots` into your state (prefer handoff values —
they were written at step completion and are authoritative). Use the handoff's `domains`,
`componentCount`, and `linkCount` as context for the step you're about to run.

If the handoff file does not exist: note this in the status display but proceed — some steps
can reconstruct state from their own artifacts.

### 4. Display Recovery Summary

Before running the step, print:

```
arch-step: pipeline state recovered
  Project:       {projectRoot}
  Repos:         {repoRoots values, one per line}
  Completed:     {completedSteps joined with " → " or "none"}
  Requested:     Step {number} — {name}
  {if completed: "⚠  Step already completed — re-running by explicit request"}
  {if step > nextStep: "⚠  Skipping steps {gap} — preceding artifacts may be missing"}
  Handoff:       {handoff file path and status: found / not found}

Running: {orchestrator file}
```

Do not ask for confirmation — proceed directly to the step.

### 5. Execute the Step Orchestrator

Read `{orchestrator-file}` and follow its instructions exactly, substituting:

```
PROJECT_ROOT: {projectRoot}
REPO_PATHS:   {space-separated repoRoots values}
```

The orchestrator is self-contained — it will run its own `detect-phase.ts --status started`,
do its work, and emit `handoff-{step}.json` when complete. No further action is needed from
this command after the orchestrator completes.

## Examples

### Resume after context reset (step by name)

```
/arch-step explore --project-root /projects/my-api
```

### Jump to extract step by number

```
/arch-step 4 --project-root /projects/my-api
```

### Re-run validate

```
/arch-step validate --project-root /projects/my-api
```

### Skip ahead to connect after manual extract

```
/arch-step connect --project-root /projects/my-api
```
