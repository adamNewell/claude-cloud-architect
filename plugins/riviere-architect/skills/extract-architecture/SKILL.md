---
name: extract-architecture
description: "Extract, map, and document existing software architecture as a structured component graph using Rivière (living-architecture.dev). USE WHEN: reverse-engineering a codebase, creating an architecture diagram, mapping domains and services, discovering bounded contexts, documenting how components connect, understanding how a system is structured, mapping microservices or distributed systems, analyzing monorepo or multi-repo architectures. Produces a queryable graph of APIs, use cases, domain operations, events, and their links."
---

# Riviere Architect

## Purpose

Explore an existing codebase or system and produce a comprehensive, structured architecture graph.

## Pipeline Overview

The extraction pipeline has 8 steps, each run by a fresh agent with handoff-based context isolation:

| Step | Name      | Orchestrator                      | Agent Definition                   | Purpose                                   |
| ---- | --------- | --------------------------------- | ---------------------------------- | ----------------------------------------- |
| 0    | Classify  | `steps/classify-orchestrator.md`  | — (runs inline)                    | System type, complexity, lens activation  |
| 1    | Explore   | `steps/explore-orchestrator.md`   | `agents/explore-agent.md`          | Discover repos, domains, conventions      |
| 2    | Configure | `steps/configure-orchestrator.md` | `agents/configure-agent.md`        | Define extraction rules per type/repo     |
| 3    | Extract   | `steps/extract-orchestrator.md`   | `agents/extract-staging-agent.md`  | Grep + rules → staged components (JSONL)  |
| 4    | Connect   | `steps/connect-orchestrator.md`   | `agents/connect-staging-agent.md`  | Call-chain tracing → staged links (JSONL) |
| 5    | Annotate  | `steps/annotate-orchestrator.md`  | `agents/annotate-staging-agent.md` | Business logic enrichment → staged JSONL  |
| 6    | Trace     | `steps/trace-orchestrator.md`     | `agents/trace-staging-agent.md`    | Feature↔code bidirectional traceability   |
| 7    | Validate  | `steps/validate-orchestrator.md`  | `agents/validate-agent.md`         | Schema + orphans + doc verification       |

**Context isolation:** Each step runs in a fresh agent. No conversation history crosses step boundaries. Steps communicate via `handoff-{step}.json` files in `.riviere/work/`.

## Agent Definitions

Agent definitions in `agents/` provide formal frontmatter (name, model, tools) for subagent spawning:

| Agent            | File                               | Model  | Output                        |
| ---------------- | ---------------------------------- | ------ | ----------------------------- |
| Explore          | `agents/explore-agent.md`          | sonnet | Meta/domain files             |
| Configure        | `agents/configure-agent.md`        | sonnet | Rule JSONL                    |
| Extract Staging  | `agents/extract-staging-agent.md`  | sonnet | Component JSONL → replay tool |
| Connect Staging  | `agents/connect-staging-agent.md`  | sonnet | Link JSONL → replay tool      |
| Annotate Staging | `agents/annotate-staging-agent.md` | sonnet | Enrichment JSONL → replay tool|
| Trace Staging    | `agents/trace-staging-agent.md`    | sonnet | Trace JSONL                   |
| Validate         | `agents/validate-agent.md`         | sonnet | Analysis JSONL                |

All agents have `tools: Read, Write, Edit, Glob, Grep` (no Bash). Graph writes flow exclusively through orchestrator replay tools.

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
| Classify (Step 0)  | No — no builder calls          | No — no CLI calls yet                       |
| Explore (Step 1)   | No — no builder calls          | Only if wiki was indexed in Wiki Index step |
| Configure (Step 2) | No — no builder calls          | Only if wiki was indexed in Wiki Index step |
| Extract (Step 3)   | Yes — before any builder calls | Only if running qmd queries                 |
| Connect (Step 4)   | Yes — before any builder calls | Only if running qmd queries                 |
| Annotate (Step 5)  | Yes — before enrich calls      | Only if running qmd queries                 |
| Trace (Step 6)     | No — no builder calls          | Only if running qmd queries                 |
| Validate (Step 7)  | Yes — before validate call     | No — not needed                             |

## Tools Reference

Run all tools from the **skill root** (the directory containing SKILL.md), not the target repository root.

| Tool                                 | Purpose                                     | Example Usage                                                                                                                 |
| ------------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `tools/classify-system.ts`           | Classify system type, complexity, lenses    | `bun tools/classify-system.ts --project-root "$PROJECT_ROOT" <repo-paths...>`                                                 |
| `tools/detect-phase.ts`              | Detect/record current extraction phase      | `bun tools/detect-phase.ts --project-root "$PROJECT_ROOT"`                                                                    |
| `tools/merge-domains.ts`             | Merge per-repo domain discoveries           | `bun tools/merge-domains.ts --project-root "$PROJECT_ROOT" --add-to-graph`                                                    |
| `tools/build-metadata.ts`            | Merge per-repo JSONL facets into metadata   | `bun tools/build-metadata.ts --project-root "$PROJECT_ROOT"`                                                                  |
| `tools/triangulate.ts`               | Merge multi-prong outputs with confidence   | `bun tools/triangulate.ts --project-root "$PROJECT_ROOT" --input-dir .riviere/work --output .riviere/work/triangulated.jsonl` |
| `tools/init-graph.ts`                | Initialize graph from config files          | `bun tools/init-graph.ts --project-root "$PROJECT_ROOT" --dry-run`                                                            |
| `tools/replay-staged-components.ts`  | Execute staged component commands           | `bun tools/replay-staged-components.ts --project-root "$PROJECT_ROOT"`                                                        |
| `tools/split-checklist.ts`           | Split master checklist into per-repo files  | `bun tools/split-checklist.ts --project-root "$PROJECT_ROOT" --checklist .riviere/work/check.md`                              |
| `tools/generate-link-candidates.ts`  | Suggest candidate links for Step 4          | `bun tools/generate-link-candidates.ts --project-root "$PROJECT_ROOT"`                                                        |
| `tools/replay-staged-links.ts`       | Execute staged link commands                | `bun tools/replay-staged-links.ts --project-root "$PROJECT_ROOT"`                                                             |
| `tools/replay-staged-enrichments.ts` | Execute staged enrichment commands          | `bun tools/replay-staged-enrichments.ts --project-root "$PROJECT_ROOT"`                                                       |
| `tools/build-trace-map.ts`           | Build bidirectional feature↔code traces     | `bun tools/build-trace-map.ts --project-root "$PROJECT_ROOT"`                                                                 |
| `tools/verify-docs.ts`               | Cross-reference graph against documentation | `bun tools/verify-docs.ts --project-root "$PROJECT_ROOT"`                                                                     |
| `tools/validate-graph.ts`            | Validate graph schema                       | `bun tools/validate-graph.ts --project-root "$PROJECT_ROOT"`                                                                  |
| `tools/ingest-wiki.ts`               | Index wiki content into qmd                 | `bun tools/ingest-wiki.ts ./wiki "Project Wiki"`                                                                              |
| `tools/check-hash.ts`                | Check/write source repo staleness hash      | `bun tools/check-hash.ts --project-root "$PROJECT_ROOT"` / `bun tools/check-hash.ts --project-root "$PROJECT_ROOT" --write`   |
| `tools/discover-linked-repos.ts`     | Scan IaC files for internal repo references | `bun tools/discover-linked-repos.ts --project-root "$PROJECT_ROOT" <repo-paths...>`                                           |
| `tools/agent-report.ts`             | Generate subagent completion reports        | `bun tools/agent-report.ts --project-root "$PROJECT_ROOT" --step extract --repo orders-service`                               |

## Troubleshooting & Recovery

| Symptom                                      | Recovery Action                                                        | Reference Step              |
| -------------------------------------------- | ---------------------------------------------------------------------- | --------------------------- |
| **Step 4 Linking:** High orphan count (>20%) | **Stop.** Fix `component-definitions.json` (or `.md`). Restart Step 3. | `configure-orchestrator.md` |
| **Step 4 Linking:** Missing targets          | **Stop.** Fix `domains.json` (or `.md`). Restart Step 1.               | `explore-orchestrator.md`   |
| **Step 3 Extract:** Empty components         | **Stop.** Debug `rules-*.jsonl` (or `.md`). Re-run Step 2.             | `configure-subagent.md`     |
| **Step 1 Explore:** Domain collision         | **Stop.** Manually resolve in `domains.json`. Restart Step 1.          | `explore-orchestrator.md`   |
| **Step 0 Classify:** Wrong system type       | Update `classification.json` manually. Re-run classify step.           | `classify-orchestrator.md`  |
| **Any Step:** Corrupted `graph.json`         | **Restore.** `cp -r .riviere-backup-* .riviere/`                       | See "Catastrophic Recovery" |

## Variables

WIKI_DATA: <path_to_wiki_or_url> (optional — pass as first argument; omit to skip wiki steps. Accepts: directory path, single .md file, multi-repo wikis/ parent directory, or .wiki.git URL)
**Write gate:** All graph mutations flow through TypeScript replay tools (`replay-staged-components.ts`, `replay-staged-links.ts`, `replay-staged-enrichments.ts`). Subagents produce JSONL; orchestrators replay it sequentially.
**NEVER** invent domain names — always check `.riviere/config/domains.json` first.
**NEVER** use plan mode in extraction steps — execute directly. Plan mode pauses for user approval at each step, breaking the handoff-based progression; the configuration files (domains.json, metadata.json, component-definitions.json) already replace the need for exploratory codebase analysis that plan mode provides.
**NEVER** proceed to the next step without user confirmation — domain names defined in Steps 1–2 propagate through the entire graph; a wrong boundary discovered after Step 3 requires re-running all downstream steps.
**NEVER** classify a multi-repo system as monorepo because repos share a package manager workspace — repos that deploy independently are separate even if they share a workspace root. Misclassification in Step 0 propagates wrong agent counts and lens activation through the entire pipeline.
**NEVER** assign HIGH confidence to a trace mapping based solely on naming similarity — verify with actual import evidence, call-chain references, or test file associations. Name collisions between unrelated components produce false traceability links that mislead consumers of the graph.

## Pre-Flight Checks

Before entering each step, verify these conditions. A wrong answer means the preceding step is incomplete.

| Step | Before You Start, Verify...                                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Repository paths are known and accessible. `.riviere/config/` exists.                                                           |
| 1    | `classification.json` exists and system type is confirmed by user.                                                              |
| 2    | Can you name every domain? If not, Step 1 is incomplete. `domains.json` and `metadata.json` exist.                              |
| 3    | `component-definitions.json` covers all expected types. `init-graph.ts --dry-run` succeeds.                                     |
| 4    | Component count matches expectations (within 20% of estimate). No domains have zero components.                                 |
| 5    | Link replay report shows zero failures. Orphan rate is below 20% — if above, fix linking patterns before enriching.             |
| 6    | Enrichment replay report shows zero failures. DomainOps have business-language descriptions.                                    |
| 7    | Trace map exists (or wiki is unavailable). Feature coverage assessed.                                                           |

## What Makes This Hard

Before diving into steps, understand the non-obvious challenges this workflow is designed to solve:

- **Write gate architecture** — All graph mutations are serialized through TypeScript replay tools. Subagents have no Bash access and produce JSONL only. Orchestrators replay staged output sequentially — the architecture prevents concurrent writes by design.
- **Domain ≠ Repository** — A business domain often spans multiple repos. Agents that assume one repo = one domain will produce a broken graph. The domain registry exists precisely to prevent this.
- **Module inference fragility** — Inferring which module a component belongs to requires a priority chain (code signal -> path rule -> name convention -> fallback). Skipping straight to name guessing produces noisy, unreliable graphs.
- **Orphans as diagnostic signal** — Orphaned components (>20% of total) almost always indicate a systematic linking failure in Step 4, not individual missed links. Fixing orphans one-by-one when the root cause is a pattern gap wastes significant time.
- **Context window exhaustion** — Large codebases (100+ components) can exhaust context windows. The handoff-based context isolation pattern (fresh agent per step) prevents this by passing only structured handoff files between steps.

## Three-Prong Discovery

Discovery tasks use up to three prongs for comprehensive coverage:

| Prong             | Method                                    | Confidence | Always Runs?                      |
| ----------------- | ----------------------------------------- | ---------- | --------------------------------- |
| 1 — Deterministic | Grep, decorators, path conventions        | Highest    | Yes                               |
| 2 — Semantic      | qmd wiki RAG, concept search              | Medium     | Only when qmd indexed             |
| 3 — Agentic       | Multi-file call-chain, cross-repo tracing | Varies     | Only when classification warrants |

Results are merged via `tools/triangulate.ts` with confidence scoring:

- Found by 3 prongs → HIGH confidence (auto-accept)
- Found by 2 prongs → MEDIUM confidence (auto-accept with flag)
- Found by 1 prong → LOW confidence (flag for user review)
- Contradictions → escalate to user

## Context Recovery (After Compaction)

If the conversation is compacted mid-extraction, run this immediately to recover state:

```bash
bun tools/detect-phase.ts --project-root "$PROJECT_ROOT"
```

This outputs: current phase, completed steps, project root, repo roots, domains, and component/link counts. Read the indicated step file to resume.

If `progress.json` exists (authoritative), it is used directly. Otherwise, the tool infers the phase from `.riviere/` artifacts and writes `progress.json` for future use.

The tool also reads `handoff-{step}.json` files for structured context from the previous step.

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

| Situation                           | Action                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `WIKI_DATA` argument provided       | Verify format (single doc, doc set, or directory) -> Classify -> Explore |
| No wiki, user wants to generate one | `steps/wiki-build.md` -> `steps/wiki-index.md` -> Classify -> Explore    |
| No wiki, skip / wiki already exists | Classify -> Explore directly                                             |

### Execution Mode Matrix

| Mode        | Repository Count | Step Behavior                                                                                   |
| ----------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| Single-Repo | 1                | **Orchestrator acts as Subagent.** Do not spawn; execute subagent steps directly.               |
| Multi-Repo  | 2+               | **Orchestrator spawns Subagents.** One subagent per repo (Steps 0-1) or per type/repo (Step 2). |

### Wiki Build — Generate Wiki (Optional)

**MANDATORY:** Read `steps/wiki-build.md`

### Wiki Index - Register Wiki via qmd (Optional)

**MANDATORY:** Read `steps/wiki-index.md`

### Setup (Required First Run)

**MANDATORY:** Read `steps/setup.md` to verify prerequisites before beginning.

### Entry Point

**MANDATORY:** Read `steps/classify-orchestrator.md` to begin Step 0 (Classify).

Steps communicate via handoff files — each step's orchestrator doc contains a Handoff section that produces the `handoff-{step}.json` consumed by the next step.
