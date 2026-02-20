# AWS Well-Architected Best Practices Plugin

A Claude Code plugin providing skills and agents for reviewing code against AWS Well-Architected Framework best practices.

## Overview

This plugin enables Claude Code to perform architecture reviews against AWS Well-Architected Framework best practices. It uses a progressive disclosure approach to efficiently manage context while providing access to 300+ best practices across all six pillars and specialized lenses.

## Features

- **Architecture Reviews**: Automatically analyze code changes against relevant WAF pillars
- **Progressive Disclosure**: Three-level data access (index → summary → full docs) for context efficiency
- **Pillar Agents**: Specialized reviewers for Security, Reliability, Performance, Cost, Ops, and Sustainability
- **DevOps Guidance**: Saga-based review using indicators, anti-patterns, and metrics
- **Lens Support**: Serverless, IoT, GenAI, and 11 other specialized lenses
- **Smart Inference**: Automatically determines relevant pillars based on file patterns

## Installation

### Quick Start (Development)

Load the plugin directly for the current session:

```bash
claude --plugin-dir /path/to/aws-waf-best-practices
```

### Install via Marketplace

Add the repository as a marketplace source, then install:

```bash
# Add marketplace source
claude plugin marketplace add adamNewell/aws-waf-best-practices
claude plugin install aws-waf-best-practices

# OR

/plugin marketplace add adamNewell/aws-waf-best-practices
/plugin install aws-waf-best-practices
```

### Validate Installation

From within Claude Code:

```text
/plugin    # Check "Installed" tab for the plugin
/mcp       # Verify MCP servers are running
```

**Prerequisites:**

- [uv](https://docs.astral.sh/uv/) (`uvx` commands)
- [Node.js](https://nodejs.org/) (`npx` commands)
- AWS credentials configured for cost management, DynamoDB, and pricing servers

The WAF review skills (`/review-waf-architecture`, `/look-up-waf-practices`) work without MCP servers -- they use the bundled practice data.

## Skills

### `/look-up-waf-practices` (User-invocable)

Look up AWS Well-Architected Framework practices by ID, keyword, or filter.

```bash
/look-up-waf-practices SEC01-BP01           # Get practice by ID
/look-up-waf-practices "encryption at rest" # Search by keyword
/look-up-waf-practices --pillar security --risk HIGH  # Filter practices
/look-up-waf-practices --devops DL.CI       # DevOps capability lookup
```

### `/review-waf-architecture` (User-invocable)

Review code against AWS Well-Architected Framework. Spawns specialized pillar agents based on file analysis.

```bash
/review-waf-architecture                    # Review current branch changes
/review-waf-architecture --pillars security,reliability
/review-waf-architecture --lenses serverless
/review-waf-architecture --comprehensive    # Run all 7 agents
```

**Default behavior:**

1. Analyzes `git diff main...HEAD` to identify changed files
2. Infers relevant pillars and lenses from file patterns
3. Spawns appropriate pillar agents in parallel
4. Aggregates findings by risk level

### `/aws-practices-audit` (User-invocable)

Audit AWS code and infrastructure against best practices using MCP-powered tools. Spawns domain-specific agents in parallel.

```bash
/aws-practices-audit                         # Audit current branch changes
/aws-practices-audit --full                  # Audit entire project
/aws-practices-audit --domains cost,iac      # Explicit domain selection
/aws-practices-audit --comprehensive         # Run all domain agents
```

**Default behavior:**

1. Analyzes `git diff main...HEAD` to identify changed files
2. Infers relevant audit domains from file patterns
3. Spawns domain agents that use MCP tools (cost management, IaC, DynamoDB, AWS KB, Powertools)
4. Aggregates findings by risk level

### `querying-waf-data` (Agent utility)

Internal skill used by reviewer agents to query practice data. Not user-invocable.

## Agents

### WAF Pillar Reviewers

| Agent                              | Focus Areas                             |
| ---------------------------------- | --------------------------------------- |
| `security-practice-reviewer`       | Auth, encryption, IAM, data protection  |
| `reliability-practice-reviewer`    | Fault tolerance, recovery, availability |
| `performance-practice-reviewer`    | Scaling, caching, optimization          |
| `cost-practice-reviewer`           | Resource efficiency, rightsizing        |
| `ops-practice-reviewer`            | Observability, runbooks, automation     |
| `sustainability-practice-reviewer` | Resource efficiency, carbon impact      |
| `devops-practice-reviewer`         | CI/CD, testing, governance (saga-based) |

### MCP-Powered Auditors

| Agent                        | MCP Tools                                                       | Focus Areas                              |
| ---------------------------- | --------------------------------------------------------------- | ---------------------------------------- |
| `cost-optimization-auditor`  | `compute_optimizer`, `cost_optimization`, `analyze_cdk_project` | Rightsizing, waste, pricing models       |
| `iac-best-practices-auditor` | `cdk_best_practices`                                            | CDK construct quality, security defaults |
| `dynamodb-model-auditor`     | `dynamodb_data_model_validation`                                | Key design, access patterns, GSIs        |
| `aws-knowledge-auditor`      | `aws___search_documentation`, `search_docs`                     | AWS docs cross-ref, Powertools adoption  |

## Progressive Disclosure

The plugin uses three levels of data access to optimize context usage:

| Level       | Source                      | Content                       | When Used                       |
| ----------- | --------------------------- | ----------------------------- | ------------------------------- |
| 1 - Index   | `data/pillars/*.md` tables  | IDs, titles, risk levels      | Agent starts review             |
| 2 - Summary | `data/pillars/*.md` details | + description, outcome, areas | Practice identified as relevant |
| 3 - Full    | WebFetch href URL           | Complete AWS documentation    | Summary insufficient            |

## Data Structure

```text
plugin/
├── agents/                          # 11 agents
│   ├── security-practice-reviewer.md    # WAF Security pillar
│   ├── reliability-practice-reviewer.md # WAF Reliability pillar
│   ├── performance-practice-reviewer.md # WAF Performance pillar
│   ├── cost-practice-reviewer.md        # WAF Cost pillar
│   ├── ops-practice-reviewer.md         # WAF Ops Excellence pillar
│   ├── sustainability-practice-reviewer.md # WAF Sustainability pillar
│   ├── devops-practice-reviewer.md      # WAF DevOps (saga-based)
│   ├── cost-optimization-auditor.md     # MCP: compute_optimizer, cost_optimization, analyze_cdk_project
│   ├── iac-best-practices-auditor.md    # MCP: cdk_best_practices
│   ├── dynamodb-model-auditor.md        # MCP: dynamodb_data_model_validation
│   └── aws-knowledge-auditor.md         # MCP: aws___search_documentation, search_docs
├── skills/
│   ├── review-waf-architecture/         # WAF review orchestrator
│   ├── look-up-waf-practices/           # Practice lookup
│   ├── query-waf-data/                  # Agent utility (not user-invocable)
│   └── aws-practices-audit/             # Best practices audit orchestrator (MCP-powered)
├── scripts/
│   ├── waf_query.py                     # Query CLI
│   └── generate_data.py                 # Markdown generator
└── data/
    ├── source/                          # Source JSON files
    │   ├── security.json
    │   ├── reliability.json
    │   └── lens/                        # Lens-specific practices (14 lenses)
    ├── pillars/                         # Generated markdown (Level 1+2)
    ├── lenses/                          # Lens-filtered practices
    ├── devops/                          # DevOps saga data
    └── index.md                         # Data overview
```

## Query CLI

The `waf_query.py` script provides direct access to practice data:

```bash
# List practices by pillar and risk
python plugin/scripts/waf_query.py index --pillar security --risk HIGH

# Get practice details
python plugin/scripts/waf_query.py detail SEC01-BP01

# Search practices
python plugin/scripts/waf_query.py search "encryption"

# DevOps capabilities
python plugin/scripts/waf_query.py devops-index --saga DL
python plugin/scripts/waf_query.py devops-detail DL.CI
```

## Regenerating Data

If source JSON is updated, regenerate the markdown files:

```bash
python plugin/scripts/generate_data.py
```

## Inference Heuristics

The orchestrator skill uses file patterns to determine relevant pillars:

| File Patterns               | Pillar(s)               | Lens       |
| --------------------------- | ----------------------- | ---------- |
| `*policy*.json`, IAM, KMS   | Security                | -          |
| `lambda/`, `serverless.yml` | Perf, Cost, Reliability | Serverless |
| `*-iot-*`, AWS IoT imports  | Security, Reliability   | IoT        |
| `Dockerfile`, ECS/EKS       | Perf, Security          | Container  |
| `.github/workflows/`        | -                       | DevOps     |

## Coverage

- **Framework Pillars**: 6 pillars, 300+ practices
- **Specialized Lenses**: 14 lenses (Serverless, IoT, GenAI, ML, SaaS, etc.)
- **DevOps Guidance**: 5 sagas, 27 capabilities, 180+ indicators

## License

Apache-2.0
