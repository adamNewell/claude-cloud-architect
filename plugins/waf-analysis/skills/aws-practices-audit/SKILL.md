---
name: aws-practices-audit
description: Audits AWS code and infrastructure against best practices using MCP-powered tools. Use when the user asks to audit, validate, or check AWS best practices, review CDK/IaC code quality, validate DynamoDB data models, analyze cost optimization, or check Powertools usage. Spawns domain-specific agents in parallel. Supports --full flag for full project audit (default is git diff scope).
---

# AWS Practices Audit Orchestrator

You orchestrate best-practices audits by spawning domain-specific agents in parallel. Each agent uses dedicated MCP tools to validate against AWS standards.

## Default Workflow

1. **Determine scope**: `git diff main...HEAD --name-only` (or full project with `--full`)
2. **Infer relevant domains** using heuristics below
3. **Spawn domain agents** in parallel using Task tool

## Domain Inference Heuristics

| File Patterns                                                         | Agents to Spawn                       |
| --------------------------------------------------------------------- | ------------------------------------- |
| `cdk.json`, `**/cdk/**`, `*.template.json`, `*Stack*`, `*Construct*`  | IaC Best Practices, Cost Optimization |
| `*dynamodb*`, `*table*`, `*-table.*`, `*Table*` construct definitions | DynamoDB Model Validation             |
| `lambda/`, `*handler*`, `*function*`, `serverless.*`                  | AWS Knowledge (Powertools)            |
| `**/infra/**`, `*.tf`, `*.template.*`, `sam.*`                        | IaC Best Practices, Cost Optimization |
| Any AWS resource definitions                                          | Cost Optimization, AWS Knowledge      |

When in doubt, spawn the agent. Over-coverage is better than missed findings.

## Override Arguments

Parse from user input or args:

- `--full` - Audit entire project, not just diff
- `--domains cost,iac,dynamodb,knowledge` - Explicit domain selection
- `--files src/infra/**` - Scope to specific files
- `--comprehensive` - Run ALL domain agents regardless of heuristics

## Agents to Spawn

| Agent                        | Domain                                     | MCP Tools Used                                                                                  |
| ---------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `cost-optimization-auditor`  | Cost efficiency, rightsizing, pricing      | `aws-cost-management`: compute_optimizer, cost_optimization; `aws-pricing`: analyze_cdk_project |
| `iac-best-practices-auditor` | CDK/IaC patterns, construct quality        | `aws-iac`: cdk_best_practices                                                                   |
| `dynamodb-model-auditor`     | Table design, access patterns, GSI usage   | `aws-dynamodb`: dynamodb_data_model_validation                                                  |
| `aws-knowledge-auditor`      | AWS docs cross-reference, Powertools usage | `aws-kb`: aws___search_documentation; `powertools`: search_docs                                 |

### Task Creation Format

For each agent, create a task using TaskCreate:

```text
- subject: "Audit [Domain]: [brief scope]"
- description: Include file list, specific areas to review, MCP tools to use
- activeForm: "Auditing [domain] practices"
```

Then spawn each agent using the Task tool with subagent_type appropriate for the agent's work.

## Execution Steps

1. Parse arguments for overrides
2. If no `--files` and no `--full`, run: `git diff main...HEAD --name-only`
3. If `--full`, gather project files: `find . -type f -name '*.ts' -o -name '*.py' -o -name '*.tf' -o -name '*.json' | grep -v node_modules | grep -v .git`
4. If no files found, ask user for scope
5. Apply heuristics to determine domains
6. Spawn parallel agents for each relevant domain
7. Wait for all agents to complete
8. Synthesize findings into unified report

## Output Format

After all agents complete, provide:

```markdown
## AWS Best Practices Audit Summary

### Scope
- Files reviewed: [count]
- Domains audited: [list]
- MCP tools used: [list]

### Critical Findings
[Priority issues across domains]

### Domain Summaries

#### Cost Optimization
[Summary from cost-optimization-auditor]

#### IaC Best Practices
[Summary from iac-best-practices-auditor]

#### DynamoDB Data Modeling
[Summary from dynamodb-model-auditor]

#### AWS Knowledge & Powertools
[Summary from aws-knowledge-auditor]

### Recommended Actions
[Prioritized list across all domains]
```

## Post-Audit

After presenting findings, recommend:
> Run `/compact` to reduce context before continuing work.
