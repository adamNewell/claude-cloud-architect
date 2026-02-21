# Step 0: Classify System (Orchestrator)

## Objective

Determine system type, complexity, and which extraction lenses to activate before
beginning codebase exploration. This step runs once at the start of the pipeline and
produces `classification.json` — the configuration that drives agent counts, lens
activation, and complexity budgets for all subsequent steps.

## Record Progress

```bash
bun tools/detect-phase.ts --project-root "$PROJECT_ROOT" --step classify --status started
```

## Prerequisites

- Repository paths are known (provided by the user or discovered in Setup)
- `.riviere/config/` directory exists (created in Setup)

## Run Classification

```bash
bun tools/classify-system.ts --project-root "$PROJECT_ROOT" {REPO_PATHS...}
```

The tool examines:

- **IaC files** — CDK, Terraform, CloudFormation, Pulumi, Serverless
- **Package manifests** — package.json dependencies for framework/messaging/db detection
- **Directory structure** — monorepo markers, source layout
- **Orchestration markers** — Step Functions, Temporal, Saga patterns
- **Communication patterns** — message brokers, event buses, async protocols
- **Deployment signals** — concrete file-based evidence for compute model:
  - `container`: Dockerfile or docker-compose present
  - `ecs-fargate`: ECS TaskDefinition/FargateService in CDK or CloudFormation
  - `lambda`: Lambda Function in CDK, CloudFormation/SAM, or `handler` export in source
  - `serverless-framework`: serverless.yml present

**Deployment model decision rules (deterministic):**

| Rule | Condition                                                | Result          |
| ---- | -------------------------------------------------------- | --------------- |
| 1    | container/ecs-fargate signals AND lambda signals present | `hybrid`        |
| 2    | container/ecs-fargate signals only                       | `containerized` |
| 3    | lambda signals only                                      | `serverless`    |
| 4    | IaC present but no compute signals                       | `cloud-managed` |
| 5    | no IaC, no compute signals                               | `traditional`   |

Note: The presence of CDK alone does **not** imply "containerized" — CDK is an
IaC tool that can deploy containers, Lambda, or both. The deployment model is
determined by what compute resources are actually defined, not which IaC tool is used.

## Review Classification

Present the classification summary to the user, including the evidence that
drove each characteristic so they can spot misclassifications immediately:

> "System classified as **{systemType}** ({confidence} confidence).
>
> **Characteristics:**
>
> - Architecture: {architecture} — {architectureEvidence[0]}
> - Communication: {communicationPattern}
> - Deployment: {deploymentModel} — based on {deploymentEvidence.length} signal(s):
>   {deploymentEvidence (list each)}
> - Data pattern: {dataPattern}
> - API style: {apiStyle}
>
> **Recommended lenses:** {lenses}
> **Complexity:** {scale} ({estimatedComponents.min}-{estimatedComponents.max} components, {estimatedDuration})
>
> Does this look correct? Any characteristics I should adjust?"

When displaying deployment evidence, quote the actual signals (e.g.
`[lambda] cdk/lib/stack.ts:42 (3 Lambda constructs)`) so the user can
verify the classification is grounded in real files.

Incorporate corrections into `classification.json` before proceeding.

## Lens Activation

Six lens types may be recommended:

| Lens            | Focus                               | Activates When                      |
| --------------- | ----------------------------------- | ----------------------------------- |
| `api-surface`   | HTTP APIs, routes, BFF patterns     | Always                              |
| `event-flow`    | Events, handlers, queues, pub/sub   | communicationPattern includes async |
| `orchestration` | Step Functions, sagas, workflows    | orchestration.detected === true     |
| `data-access`   | Repositories, ORM, database queries | Always                              |
| `domain-logic`  | Aggregates, domain services, rules  | Always                              |
| `integration`   | External APIs, cross-repo calls     | repoCount > 1 or external deps      |

Lenses affect Steps 3-5: active lenses spawn additional specialized subagents for
cross-cutting concerns that per-repo agents might miss.

## Output

**`.riviere/config/classification.json`** — system classification with:

- System type and confidence
- Characteristics (architecture, comms, deployment, data, API, orchestration)
  - Each characteristic includes an evidence array of what triggered it
  - `deploymentEvidence`: list of `[kind] file:line` signals
  - `architectureEvidence`: list of deployable unit counts and locations
- Recommended lenses
- Complexity estimate (scale, components, domains, agent counts, duration)
- Entry point hints

## Error Recovery

- **No IaC files detected:** Classification still works — it falls back to package.json
  analysis and directory structure. Note reduced confidence in the output.
- **Single repo with no package.json:** Classification produces minimal output with LOW
  confidence. Recommend the user provide context about the system type.
- **Orchestration false positive:** User review step catches this — orchestration markers
  like `StateMachine` can appear in non-workflow contexts. If user says no orchestration,
  update `classification.json` manually.

## Record Completion

```bash
bun tools/detect-phase.ts --project-root "$PROJECT_ROOT" --step classify --status completed
```

## Completion

**Step 0 complete.** Classification is ready. Wait for user confirmation before proceeding.

## Handoff

The `detect-phase.ts --status completed` call above automatically emits
`handoff-classify.json` with step context for the next agent. No further action needed.
