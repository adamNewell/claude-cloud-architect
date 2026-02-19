# Step 2: Define Component Extraction Rules (Orchestrator)

## Objective

Produce `component-definitions.md` and `linking-rules.md` — the pattern guides used in
Steps 3 and 4 to extract and link components.

## Prerequisites

- Read `.riviere/config/metadata.md` for codebase context
- Read `.riviere/config/domains.md` — use canonical domain names in all examples

## Component Types

| Type         | Definition                                          |
| ------------ | --------------------------------------------------- |
| UI           | User-facing screens/pages                           |
| API          | HTTP endpoints                                      |
| UseCase      | Application service coordinating a user goal        |
| DomainOp     | Business logic — aggregate methods, domain services |
| Event        | Domain event published after something happens      |
| EventHandler | Subscriber that reacts to an event                  |

Custom types may also be discovered — handled in the merge step below.

## Classification Anti-Patterns

Before spawning subagents, internalize these common misclassification patterns so you can recognize them in worker output during the merge step:

**NEVER** accept a `DomainOp` classification for a class that coordinates multiple domain services — that is a `UseCase`.

**NEVER** accept one domain per repository as a default — production codebases commonly split a single business domain across 2-3 repos (e.g., `orders-service` and `orders-worker`); a one-to-one assumption produces a structurally incorrect graph that cannot be fixed without restarting from Step 1. Verify against business concepts, not code boundaries.

**NEVER** accept a saga or process manager as a `UseCase` — flag it as a custom type candidate.

**When reviewing worker output:** If a worker proposes a custom type, evaluate whether 3+ instances exist across the codebase before accepting. One-off patterns do not warrant a custom type.

> **Small / single-repo codebases:** Follow `steps/configure-subagent.md` directly
> for each component type in sequence — you are both orchestrator and subagent. Use `local`
> as the repository name for file outputs: `rules-local-{type}.md`.

## Spawn Subagents

**Partition unit: one worker per (component type × repository).** Different repositories
may use different frameworks for the same type — patterns must be discovered per repo.

Spawn one subagent per combination:

```text
AGENT INSTRUCTIONS: Read steps/configure-subagent.md and follow its instructions exactly.
COMPONENT TYPE: {TypeName}
REPOSITORY: {repository-name}
REPOSITORY ROOT: {local path to repository}
PREREQUISITE: Read .riviere/config/metadata.md AND .riviere/config/domains.md
```

Spawn for every (type × repo) pair across: API, UseCase, DomainOp, Event, EventHandler, UI.

> **Single-repository codebases:** Spawn one worker per type only — use `local` as the repo name.

If Explore metadata suggests custom type candidates (e.g., background jobs, scheduled
tasks, sagas), spawn one extra worker per (candidate × repo) with a brief description
of the pattern.

## Wait and Merge

After all subagents complete:

### 1. Consolidate custom type proposals

Read all `.riviere/work/rules-*-*.md` files. Collect every "Proposed Custom Types"
section. Present a single consolidated list to the user — one conversation, not N:

> "Workers found these patterns that may warrant custom component types. Please decide:
> accept (will be `define-custom-type` in Step 3) or reject (treat as existing type)."

```markdown
## Proposed Custom Types

| Pattern                        | Suggested Name  | Decision |
| ------------------------------ | --------------- | -------- |
| Background jobs in `src/jobs/` | `BackgroundJob` |          |
| Saga orchestrators             | `Saga`          |          |
```

Record decisions. Accepted types are appended to `component-definitions.md` as a
`## Custom Types` table using this exact format (parseable by `tools/init-graph.ts`):

```markdown
## Custom Types

| Name          | Description               | Required Properties                         | Optional Properties                    |
| ------------- | ------------------------- | ------------------------------------------- | -------------------------------------- |
| BackgroundJob | Scheduled background task | schedule:string:Cron expression or interval | timeout:number:Max run time in seconds |
```

Properties are semicolon-separated: `name:type:description;name2:type2:description2`.
Leave the Optional Properties cell empty if none.

### 2. Merge extraction rules

Read all `.riviere/work/rules-{repo}-{type}.md` files. For each component type:

- **Patterns match across repos** → write one unified rule
- **Patterns differ across repos** → write the most common pattern as the main rule,
  add a `### Repo Overrides` block for repos that differ

Example:

```markdown
## API

### Identification
**Location:** `src/`
**Class pattern:** `@Controller` decorator
**Select:** methods decorated with `@Get`, `@Post`, etc.

### Repo Overrides
- `legacy-service`: uses Express `router.get(...)` — no class, extract route handlers directly
```

Merge into `.riviere/config/component-definitions.md` with this header:

```markdown
# Component Definitions

Rules and patterns for Step 3 extraction. Contains no component instances — only
identification patterns, field sources, excludes, and one example per type.
```

### 3. Merge linking patterns

Collect HTTP Client Mappings and non-HTTP linking patterns from all worker outputs.
Deduplicate — same client pattern listed once even if found in multiple repos.
Write to `.riviere/config/linking-rules.md`.

## Output

**`.riviere/config/component-definitions.md`** — extraction rules per component type.

**`.riviere/config/linking-rules.md`** — HTTP client mappings and non-HTTP linking patterns.

## Error Recovery

- **Subagent produces empty or missing `rules-{repo}-{type}.md`:** Re-spawn that worker for the affected type/repo pair only.
- **Workers propose conflicting patterns for the same type across repos:** Present the conflict to the user rather than choosing — different patterns mean different extraction strategies and the user must decide which is canonical.
- **Custom type proposals exceed 5:** Present all to user as a consolidated list and recommend accepting only those with 3+ clear instances.

## Completion

Present extraction rules AND linking rules to the user for review.

**Step 2 complete.** Wait for user feedback before proceeding.

## Next Phase

Read `steps/extract-orchestrator.md`
