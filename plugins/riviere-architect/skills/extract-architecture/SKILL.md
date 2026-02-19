---
name: extract-architecture
description: "Extract, map, and document existing software architecture as a structured component graph using Rivière (living-architecture.dev). USE WHEN: reverse-engineering a codebase, creating an architecture diagram, mapping domains and services, discovering bounded contexts, documenting how components connect, understanding how a system is structured, mapping microservices or distributed systems, analyzing monorepo or multi-repo architectures. Produces a queryable graph of APIs, use cases, domain operations, events, and their links."
---

# Riviere Architect

## Purpose

Explore an existing codebase or system and produce a comprehensive, structured architecture graph

## Tool Reference

When you need command syntax or options during any phase, load the relevant cookbook:

| Need                                                        | Load                            |
| ----------------------------------------------------------- | ------------------------------- |
| qmd collections, context, embeddings (Wiki Index)           | `../../cookbook/qmd/cli.md`     |
| command index, exit codes, concurrency rules, phase mapping | `../../cookbook/riviere/cli.md` |

Load only the cookbook you need — do not load all unless working across tools.

**Do NOT load — phase guide:**

| Phase              | Load riviere/cli.md?           | Load qmd/cli.md?                            |
| ------------------ | ------------------------------ | ------------------------------------------- |
| Setup              | No — no CLI calls yet          | No — no CLI calls yet                       |
| Explore (Step 1)   | No — no builder calls          | Only if wiki was indexed in Wiki Index step |
| Configure (Step 2) | No — no builder calls          | Only if wiki was indexed in Wiki Index step |
| Extract (Step 3)   | Yes — before any builder calls | Only if running qmd queries                 |
| Connect (Step 4)   | Yes — before any builder calls | Only if running qmd queries                 |
| Annotate (Step 5)  | Yes — before enrich calls      | Only if running qmd queries                 |
| Validate (Step 6)  | Yes — before validate call     | No — not needed                             |

## Tools Reference

Run all tools from the **skill root** (the directory containing SKILL.md), not the target repository root.

| Tool                                | Purpose                                                                                                                               | Key flags / notes                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `tools/init-graph.ts`               | Initialize graph from domains.md and component-definitions.md; runs add-source, add-domain, define-custom-type CLI calls sequentially | `--dry-run` (preview without executing), `--source-url repo=url` (supply GitHub URL if git remote resolution fails) |
| `tools/replay-staged-links.ts`      | Execute staged link JSONL sequentially; reads `.riviere/work/link-staged-*.jsonl`                                                     | Outputs `.riviere/work/link-replay-report.json` with pass/fail per command                                          |
| `tools/replay-staged-enrichments.ts`| Execute staged enrichment JSONL sequentially; reads `.riviere/work/annotate-staged-*.jsonl`                                           | Outputs `.riviere/work/enrich-replay-report.json` with pass/fail per command                                        |
| `tools/ingest-wiki.ts`              | Index wiki content into qmd; detects shape automatically (directory, single file, multi-wiki parent, git URL)                         | `<path-or-url>` required, `[collection-name]` optional                                                              |
| `tools/validate-graph.ts`           | Run JSON schema validation on the generated graph file                                                                                | No flags required                                                                                                   |
| `tools/generate-link-candidates.ts` | Generate link candidate suggestions for Step 4 review                                                                                 | No flags required                                                                                                   |

## Variables

WIKI_DATA: <path_to_wiki_or_url> (optional — pass as first argument; omit to skip wiki steps. Accepts: directory path, single .md file, multi-repo wikis/ parent directory, or .wiki.git URL)

**NEVER** call any `riviere builder` write command from subagents. Concurrency is treated as untenable for graph writes. Subagents stage output only; the coordinator executes all writes sequentially.
**NEVER** invent domain names — always check `.riviere/config/domains.md` first.
**NEVER** use plan mode in extraction steps — execute directly. Plan mode pauses for user approval at each step, breaking the self-chaining progression; the configuration files (domains.md, metadata.md, component-definitions.md) already replace the need for exploratory codebase analysis that plan mode provides.
**NEVER** proceed to the next step without user confirmation — domain names defined in Steps 1–2 propagate through the entire graph; a wrong boundary discovered after Step 3 requires re-running all downstream steps.

## What Makes This Hard

Before diving into steps, understand the non-obvious challenges this workflow is designed to solve:

- **Concurrent write corruption** — Treat all `riviere builder` write commands as concurrency-unsafe (`add-source`, `add-domain`, `define-custom-type`, `add-component`, `link`, `link-http`, `link-external`, `enrich`, `finalize`). Parallel writes can corrupt `graph.json`, drop updates, or produce parse errors.
- **Domain ≠ Repository** — A business domain often spans multiple repos. Agents that assume one repo = one domain will produce a broken graph. The `domains.md` registry exists precisely to prevent this.
- **Module inference fragility** — Inferring which module a component belongs to requires a priority chain (code signal -> path rule -> name convention -> fallback). Skipping straight to name guessing produces noisy, unreliable graphs.
- **Orphans as diagnostic signal** — Orphaned components (>20% of total) almost always indicate a systematic linking failure in Step 4, not individual missed links. Fixing orphans one-by-one when the root cause is a pattern gap wastes significant time.

## Catastrophic Recovery

When a phase fails in a way that may have corrupted the graph or broken the CLI state:

1. **Save state** — Run immediately before any further writes:
   ```bash
   cp -r .riviere/ .riviere-backup-$(date +%Y%m%d-%H%M%S)/
   ```
2. **Report to user** — State which phase failed, the exact error(s) observed, and what recovery was attempted. Do not guess or paper over the failure.
3. **User decides** — Present three options:
   - **Rollback** — Restore from the backup and retry the failed phase from its beginning
   - **Restart phase** — Discard partial output and re-run the failed phase from scratch against the current graph
   - **Abort** — Stop entirely; the backup preserves all work to date

Do not proceed past catastrophic failure without explicit user direction.

## Workflow

| Situation                           | Action                                                       |
| ----------------------------------- | ------------------------------------------------------------ |
| `WIKI_DATA` argument provided       | Verify format (single doc, doc set, or directory) -> Explore |
| No wiki, user wants to generate one | `steps/wiki-build.md` -> `steps/wiki-index.md` -> Explore    |
| No wiki, skip / wiki already exists | Explore directly                                             |

### Wiki Build — Generate Wiki (Optional)

Read `steps/wiki-build.md`

### Wiki Index - Register Wiki via qmd (Optional)

Read `steps/wiki-index.md`

### Setup (Required First Run)

Read `steps/setup.md` to verify prerequisites before beginning.

### Entry Point

Read `steps/explore-orchestrator.md` to begin.

Steps are self-chaining — each step document tells you what to load next.
