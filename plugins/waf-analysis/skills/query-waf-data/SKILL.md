---
name: query-waf-data
description: Queries AWS Well-Architected Framework practice data with progressive disclosure. Use when agents need to retrieve practice summaries, details, or search across practices. Not user-invocable - used internally by reviewer agents.
user_invocable: false
---

# Querying WAF Data

Internal utility for agents to query Well-Architected Framework practices.

## Commands

### Level 1: Get Practice Index (summaries only)

```bash
python plugin/scripts/waf_query.py index --pillar security --lens serverless --risk HIGH
```Options: `--pillar`, `--lens`, `--risk` (HIGH/MEDIUM/LOW)

### Level 2: Get Practice Details

```bash
python plugin/scripts/waf_query.py detail SEC01-BP01
```Returns full implementation guidance for a specific practice.

### Search Practices

```bash
python plugin/scripts/waf_query.py search "encryption" --pillar security
```Search across all practices by keyword.

### DevOps Practices

```bash
# Get DevOps saga index
python plugin/scripts/waf_query.py devops-index --saga DL

# Get specific DevOps practice details
python plugin/scripts/waf_query.py devops-detail DL.CI
```## Progressive Disclosure Pattern

1. Start with `index` to get practice summaries
2. Use `detail` only for practices relevant to the review
3. Use `search` when looking for specific topics
