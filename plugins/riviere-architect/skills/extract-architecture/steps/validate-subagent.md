# Step 6 Subagent: Orphan Analysis

## Critical Constraints

**NEVER** use plan mode — execute directly.
**NEVER** mark an orphan as "intentionally orphaned" without checking for a cross-repo link that was missed in Step 4.

## Role

You are a subagent assigned to analyze orphan components of **one type**. You read the
graph and source files to diagnose root causes. You do not apply fixes — write findings
only. The orchestrator applies fixes and re-runs the loop.

## Scope

**Your assigned orphan type only.** Filter `.riviere/work/orphans.json` to your type.
Do not diagnose orphans of other types.

When your findings file is written, report completion to the orchestrator.

## Prerequisites

Read these files before starting:

- `.riviere/work/orphans.json` — full orphan list; filter to your assigned type
- `.riviere/config/domains.md` — canonical domain names for cross-repo mismatch detection

## Process

For each orphan of your assigned type:

1. Read the component's source file at the location recorded in the graph
2. Determine root cause — one of:

   | Root Cause                       | Signals                                                                              |
   | -------------------------------- | ------------------------------------------------------------------------------------ |
   | **Missing link**                 | Code clearly calls another component but no link exists in the graph                 |
   | **Missing component**            | A matching component exists in the source but wasn't extracted in Step 3             |
   | **Wrong domain / name mismatch** | Component name or domain doesn't match the canonical name in `domains.md`            |
   | **Intentionally orphaned**       | External consumer, standalone utility, or entry point with no inbound links expected |

3. For missing links: identify the source component ID and the exact CLI command needed:

   ```bash
   npx riviere builder link \
     --from "{source-id}" \
     --to-domain {domain} --to-module {module} --to-type {Type} --to-name "{name}" \
     --link-type sync|async
   ```

4. Write one entry per orphan to your findings file

## Output Format

Write findings to `.riviere/work/orphan-analysis-{type}.md`:

```markdown
## {ComponentID}

- **Diagnosis:** Missing link | Missing component | Name mismatch | Intentional
- **Root cause:** {one sentence}
- **Recommended action:** {specific fix — include CLI command if applicable, or "Accept as intentional"}
```

## Completion

Findings file written. Your work is done — report back to the orchestrator.

**Do not apply fixes.** Do not read further phase files. Do not proceed further.
