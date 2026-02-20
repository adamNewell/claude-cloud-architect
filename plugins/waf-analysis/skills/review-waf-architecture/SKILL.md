---
name: review-waf-architecture
description: Reviews code and infrastructure against AWS Well-Architected Framework best practices. Use when reviewing AWS code, infrastructure changes, CloudFormation/CDK/Terraform, or when the user asks for architecture review, WAF review, or Well-Architected assessment. Spawns specialized pillar agents in parallel.
---

# WAF Architecture Review Orchestrator

You orchestrate Well-Architected Framework reviews by spawning specialized pillar agents in parallel.

## Default Workflow

1. **Get changed files**: `git diff main...HEAD --name-only`
2. **Infer relevant pillars/lenses** using heuristics below
3. **Spawn pillar agents** in parallel using Task tool

## Pillar Inference Heuristics

| File Patterns                                     | Pillars                        | Lens       |
| ------------------------------------------------- | ------------------------------ | ---------- |
| `*policy*.json`, `*iam*`, `*kms*`, `*secret*`     | Security                       | -          |
| `lambda/`, `serverless.yml`, `*function*`         | Performance, Cost, Reliability | Serverless |
| `*iot*`, `awsiot`, `@aws-cdk/aws-iot`             | Security, Reliability          | IoT        |
| `Dockerfile`, `*ecs*`, `*eks*`, `*container*`     | Performance, Security          | Container  |
| `.github/workflows/`, `buildspec.yml`, `pipeline` | -                              | DevOps     |
| `*dynamodb*`, `*rds*`, `*database*`               | Reliability, Performance       | -          |
| `*cloudwatch*`, `*alarm*`, `*dashboard*`          | Operational Excellence         | -          |
| `*s3*`, `*storage*`                               | Cost, Security                 | -          |

## Override Arguments

Parse these from user input or args:

- `--pillars security,reliability` - Explicit pillar selection
- `--lenses serverless,iot` - Explicit lens selection
- `--files src/auth/**` - Scope to specific files
- `--comprehensive` - Run ALL 7 pillar agents

## Agent Spawning

Create tasks for each relevant agent using TaskCreate. Agents to spawn:

| Agent                             | When to Spawn                               |
| --------------------------------- | ------------------------------------------- |
| `review-security-practices`       | Security pillar inferred or requested       |
| `review-reliability-practices`    | Reliability pillar inferred or requested    |
| `review-performance-practices`    | Performance pillar inferred or requested    |
| `review-cost-practices`           | Cost pillar inferred or requested           |
| `review-ops-practices`            | Ops Excellence pillar inferred or requested |
| `review-sustainability-practices` | `--comprehensive` only                      |
| `review-devops-practices`         | CI/CD files detected or DevOps lens         |

### Task Creation Format

```text
For each agent, create a task:
- subject: "Review [Pillar]: [brief scope]"
- description: Include file list, lens context, specific areas to review
- activeForm: "Reviewing [pillar] practices"
```

## Execution Steps

1. Parse arguments for overrides
2. If no `--files`, run: `git diff main...HEAD --name-only`
3. If no changes found, ask user for scope
4. Apply heuristics to determine pillars/lenses
5. Create parallel tasks for each relevant pillar agent
6. Wait for all agents to complete
7. Synthesize findings into unified report

## Output Format

After all agents complete, provide:

```markdown
## WAF Architecture Review Summary

### Scope
- Files reviewed: [count]
- Pillars assessed: [list]
- Lenses applied: [list]

### Critical Findings
[Priority issues across pillars]

### Pillar Summaries
[Brief summary from each agent]

### Recommended Actions
[Prioritized list]
```## Post-Review

After presenting findings, recommend:
> Run `/compact` to reduce context before continuing work.
