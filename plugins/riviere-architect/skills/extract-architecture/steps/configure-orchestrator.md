# Step 2: Define Component Extraction Rules (Orchestrator)

## Objective

Produce `component-definitions.json` and `linking-rules.json` — the pattern guides used in
Steps 3 and 4 to extract and link components.

## Record Progress

```bash
bun tools/detect-phase.ts --project-root "$PROJECT_ROOT" --step configure --status started
```

## Prerequisites

- Read `.riviere/config/metadata.json` for codebase context
- Read `.riviere/config/domains.json` -- use canonical domain names in all examples

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
> as the repository name for file outputs: `rules-local-{type}.jsonl`.

## Spawn Subagents

**Partition unit: one worker per (component type × repository).** Different repositories
may use different frameworks for the same type — patterns must be discovered per repo.

Spawn one subagent per combination:

```text
AGENT INSTRUCTIONS: Read steps/configure-subagent.md and follow its instructions exactly.
COMPONENT TYPE: {TypeName}
REPOSITORY: {repository-name}
REPOSITORY ROOT: {local path to repository}
PREREQUISITE: Read .riviere/config/metadata.json AND .riviere/config/domains.json
```

Spawn for every (type × repo) pair across: API, UseCase, DomainOp, Event, EventHandler, UI.

> **Single-repository codebases:** Spawn one worker per type only — use `local` as the repo name.

If Explore metadata suggests custom type candidates (e.g., background jobs, scheduled
tasks, sagas), spawn one extra worker per (candidate × repo) with a brief description
of the pattern.

## Wait and Merge

After all subagents complete:

### 1. Consolidate custom type proposals

```bash
jq -s '[.[] | select(.kind == "customTypeProposal")]' "$PROJECT_ROOT"/.riviere/work/rules-*-*.jsonl
```

Present all proposals as a single consolidated list to the user -- one conversation, not N:

> "Workers found these patterns that may warrant custom component types. Please decide:
> accept (will be `define-custom-type` in Step 3) or reject (treat as existing type)."

```markdown
## Proposed Custom Types

| Pattern                        | Suggested Name  | Instance Count | Decision |
| ------------------------------ | --------------- | -------------- | -------- |
| Background jobs in `src/jobs/` | `BackgroundJob` | 6              |          |
| Saga orchestrators             | `Saga`          | 4              |          |
```

Record decisions. Accepted types are written to `component-definitions.json` in the
`customTypes` array (parseable by `tools/init-graph.ts`):

```json
{
  "customTypes": [
    {
      "name": "BackgroundJob",
      "description": "Scheduled background task",
      "requiredProperties": [{"name":"schedule","type":"string","description":"Cron expression or interval"}],
      "optionalProperties": [{"name":"timeout","type":"number","description":"Max run time in seconds"}]
    }
  ]
}
```

### 2. Merge extraction rules

```bash
jq -s '[.[] | select(.kind == "extractionRule" or .kind == "example")] | group_by(.type)' "$PROJECT_ROOT"/.riviere/work/rules-*-*.jsonl
```

For each component type:

- **Patterns match across repos** -> write one unified rule
- **Patterns differ across repos** -> write the most common pattern as the main rule,
  add repo-specific overrides

Merge into `.riviere/config/component-definitions.json` (append to the object that already
contains `customTypes`). Add an `extractionRules` key:

```json
{
  "extractionRules": {
    "API": {
      "location": "src/",
      "classPattern": "@Controller",
      "select": "methods with @Get/@Post",
      "fields": [{"schemaField":"httpMethod","source":"decorator name"}],
      "exclude": ["health checks"],
      "overrides": {
        "legacy-service": {"classPattern":"router.get(...)","select":"route handler functions"}
      }
    }
  },
  "customTypes": []
}
```

### 3. Merge linking patterns

```bash
jq -s '[.[] | select(.kind == "httpClient" or .kind == "linkPattern" or .kind == "validationRule")] | unique_by(.name // .clientPattern // .rule)' "$PROJECT_ROOT"/.riviere/work/rules-*-*.jsonl
```

Deduplicate -- same client pattern listed once even if found in multiple repos.

Write to `.riviere/config/linking-rules.json`:

```json
{
  "version": "1.0",
  "httpClients": [
    {"clientPattern":"ordersApi","targetDomain":"orders","internal":true}
  ],
  "linkPatterns": [
    {"name":"MQTT event flow","indicator":"@MessagePattern","fromType":"EventHandler","toType":"Event"}
  ],
  "validationRules": [
    {"rule":"API must link to UseCase or DomainOp","scope":"orders-service"}
  ]
}
```

## Output

Two artifacts:

**`.riviere/config/component-definitions.json`** -- extraction rules per component type + custom types.

**`.riviere/config/linking-rules.json`** -- HTTP client mappings, linking patterns, and validation rules.

## Error Recovery

- **Subagent produces empty or missing `rules-{repo}-{type}.jsonl`:** Re-spawn that worker for the affected type/repo pair only.
- **Workers propose conflicting patterns for the same type across repos:** Present the conflict to the user rather than choosing -- different patterns mean different extraction strategies and the user must decide which is canonical.
- **Custom type proposals exceed 5:** Present all to user as a consolidated list and recommend accepting only those with 3+ clear instances.

## Record Completion

```bash
bun tools/detect-phase.ts --project-root "$PROJECT_ROOT" --step configure --status completed
```

## Completion

Present extraction rules AND linking rules to the user for review.

**Step 2 complete.** Wait for user feedback before proceeding.

## Handoff

The `detect-phase.ts --status completed` call above automatically emits
`handoff-configure.json` with step context for the next agent. No further action needed.
