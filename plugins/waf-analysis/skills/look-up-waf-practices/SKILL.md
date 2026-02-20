---
name: look-up-waf-practices
description: Looks up AWS Well-Architected Framework best practices by ID, keyword, or filter. Use when the user asks about specific WAF practices, wants to search best practices, or asks questions like "what are the high-risk security practices" or "tell me about SEC01-BP01".
---

# Looking Up WAF Practices

Look up AWS Well-Architected Framework best practices by ID, keyword, or filter.

## Parse User Query

Determine the query type from the user's input:

1. **ID Lookup** - Input matches pattern like `SEC01-BP01`, `REL01-BP01`, `COST01-BP02`
2. **DevOps Lookup** - Input matches pattern like `DL.CI`, `QA.CT`, `OB.MO`
3. **Keyword Search** - Input is a quoted string like `"encryption at rest"`
4. **Filtered Query** - Input contains `--pillar`, `--risk`, or `--lens` flags

## Execute Query

Run the appropriate command from the plugin directory:

### ID Lookup

```bash
python plugin/scripts/waf_query.py detail {ID}
```### DevOps Lookup

```bash
python plugin/scripts/waf_query.py devops-detail {ID}
```### Keyword Search

```bash
python plugin/scripts/waf_query.py search "{keyword}" [--pillar {pillar}]
```### Filtered Query

```bash
python plugin/scripts/waf_query.py index --pillar {pillar} [--lens {lens}] [--risk {risk}]
```For DevOps filtering:

```bash
python plugin/scripts/waf_query.py devops-index [--saga {saga}]
```## Valid Values

**Pillars:** security, reliability, performance, cost, ops, sustainability

**Lenses:** serverless, iot, genai, data-analytics, container, ml, saas, financial, healthcare, government, sap, migration, connected-mobility, mergers-acquisitions

**Risk:** HIGH, MEDIUM, LOW

**DevOps Sagas:** DL (Development Lifecycle), QA (Quality Assurance), OB (Observability), AG (Automated Governance), OA (Organizational Adoption)

## Output Format

For single practice results, format as:

```markdown
## [Practice ID]: [Title]
**Risk:** HIGH | **Pillar:** Security | **Lens:** Framework

[Description]

**Desired Outcome:** [outcome]

**Areas:** [area1], [area2]

**Related Practices:** [links]

**Full Documentation:** [href URL]
```For search results or filtered lists, present the markdown table output from the script.

## Examples

| User Input                      | Command                                                                  |
| :------------------------------ | :----------------------------------------------------------------------- |
| `SEC01-BP01`                    | `python plugin/scripts/waf_query.py detail SEC01-BP01`                   |
| `"encryption at rest"`          | `python plugin/scripts/waf_query.py search "encryption at rest"`         |
| `--pillar security --risk HIGH` | `python plugin/scripts/waf_query.py index --pillar security --risk HIGH` |
| `--devops DL.CI`                | `python plugin/scripts/waf_query.py devops-detail DL.CI`                 |
| `--devops --saga DL`            | `python plugin/scripts/waf_query.py devops-index --saga DL`              |
