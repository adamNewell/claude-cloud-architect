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

| Tool                                 | Purpose                                    | Example Usage                                                     |
| ------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------- |
| `tools/init-graph.ts`                | Initialize graph from config files         | `bun tools/init-graph.ts --project-root "$PROJECT_ROOT" --dry-run`                               |
| `tools/replay-staged-links.ts`       | Execute staged link commands               | `bun tools/replay-staged-links.ts --project-root "$PROJECT_ROOT"`                                |
| `tools/replay-staged-enrichments.ts` | Execute staged enrichment commands         | `bun tools/replay-staged-enrichments.ts --project-root "$PROJECT_ROOT"`                          |
| `tools/replay-staged-components.ts`  | Execute staged component commands          | `bun tools/replay-staged-components.ts --project-root "$PROJECT_ROOT"`                           |
| `tools/split-checklist.ts`           | Split master checklist into per-repo files | `bun tools/split-checklist.ts --project-root "$PROJECT_ROOT" --checklist .riviere/work/check.md` |
| `tools/merge-domains.ts`             | Merge per-repo domain discoveries          | `bun tools/merge-domains.ts --project-root "$PROJECT_ROOT" --add-to-graph`                       |
| `tools/ingest-wiki.ts`               | Index wiki content into qmd                | `bun tools/ingest-wiki.ts ./wiki "Project Wiki"`                  |
| `tools/validate-graph.ts`            | Validate graph schema                      | `bun tools/validate-graph.ts --project-root "$PROJECT_ROOT"`                                     |
| `tools/check-hash.ts`               | Check/write source repo staleness hash     | `bun tools/check-hash.ts --project-root "$PROJECT_ROOT"` / `bun tools/check-hash.ts --project-root "$PROJECT_ROOT" --write`     |
| `tools/generate-link-candidates.ts`  | Suggest candidate links for Step 4         | `bun tools/generate-link-candidates.ts --project-root "$PROJECT_ROOT"`                           |
| `tools/discover-linked-repos.ts`    | Scan IaC files for internal repo references | `bun tools/discover-linked-repos.ts --project-root "$PROJECT_ROOT" <repo-paths...>`             |
| `tools/detect-phase.ts`             | Detect/record current extraction phase     | `bun tools/detect-phase.ts --project-root "$PROJECT_ROOT"`                                       |

## Troubleshooting & Recovery

| Symptom                                      | Recovery Action                                              | Reference Step              |
| -------------------------------------------- | ------------------------------------------------------------ | --------------------------- |
| **Step 4 Linking:** High orphan count (>20%) | **Stop.** Fix `component-definitions.md`. Restart Step 3.    | `configure-orchestrator.md` |
| **Step 4 Linking:** Missing targets          | **Stop.** Fix `domains.md` or `metadata.md`. Restart Step 1. | `explore-orchestrator.md`   |
| **Step 3 Extract:** Empty components         | **Stop.** Debug `rules-*.md`. Re-run Step 2 for that type.   | `configure-subagent.md`     |
| **Step 1 Explore:** Domain collision         | **Stop.** Manually resolve in `domains.md`. Restart Step 1.  | `explore-orchestrator.md`   |
| **Any Step:** Corrupted `graph.json`         | **Restore.** `cp -r .riviere-backup-* .riviere/`             | See "Catastrophic Recovery" |

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

## Context Recovery (After Compaction)

If the conversation is compacted mid-extraction, run this immediately to recover state:

```bash
bun tools/detect-phase.ts --project-root "$PROJECT_ROOT"
```

This outputs: current phase, completed steps, project root, repo roots, domains, and component/link counts. Read the indicated step file to resume.

If `progress.json` exists (authoritative), it is used directly. Otherwise, the tool infers the phase from `.riviere/` artifacts and writes `progress.json` for future use.

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

### Execution Mode Matrix

| Mode        | Repository Count | Step Behavior                                                                                |
| ----------- | ---------------- | -------------------------------------------------------------------------------------------- |
| Single-Repo | 1                | **Orchestrator acts as Subagent.** Do not spawn; execute subagent steps directly.            |
| Multi-Repo  | 2+               | **Orchestrator spawns Subagents.** One subagent per repo (Step 1) or per type/repo (Step 2). |

### Wiki Build — Generate Wiki (Optional)

**MANDATORY:** Read `steps/wiki-build.md`

### Wiki Index - Register Wiki via qmd (Optional)

**MANDATORY:** Read `steps/wiki-index.md`

### Setup (Required First Run)

**MANDATORY:** Read `steps/setup.md` to verify prerequisites before beginning.

### Entry Point

**MANDATORY:** Read `steps/explore-orchestrator.md` to begin.

Steps are self-chaining — each step document tells you what to load next.
