---
name: extract-architecture
description: "Extract, map, and document existing software architecture as a structured component graph using Rivière (living-architecture.dev). USE WHEN: reverse-engineering a codebase, creating an architecture diagram, mapping domains and services, discovering bounded contexts, documenting how components connect, understanding how a system is structured, mapping microservices or distributed systems, analyzing monorepo or multi-repo architectures. Produces a queryable graph of APIs, use cases, domain operations, events, and their links."
---

# Riviere Architect

## Purpose

Explore an existing codebase or system and produce a comprehensive, structured architecture graph

## Tool Reference

When you need command syntax or options during any phase, load the relevant cookbook:

| Need                                                        | Load                      |
| ----------------------------------------------------------- | ------------------------- |
| qmd collections, context, embeddings (Wiki Index)           | `cookbook/qmd/cli.md`     |
| command index, exit codes, concurrency rules, phase mapping | `cookbook/riviere/cli.md` |

Load only the cookbook you need — do not load all unless working across tools.

## Variables

WIKI_DATA: $1 -- Default: NONE

**NEVER** call `add-component`, `enrich`, or `link` from subagents — concurrent writes corrupt the graph. Workers write staged JSONL; the coordinator serializes all CLI calls.
**NEVER** invent domain names — always check `.riviere/config/domains.md` first.
**NEVER** use plan mode in extraction steps — execute directly.
**NEVER** proceed to the next step without user confirmation.

## What Makes This Hard

Before diving into steps, understand the non-obvious challenges this workflow is designed to solve:

- **Concurrent write corruption** — Riviere's graph JSON is not concurrency-safe. Parallel agents writing to it simultaneously cause 45-60% data loss per round. This is why workers always stage to JSONL and only the coordinator serializes CLI calls.
- **Domain ≠ Repository** — A business domain often spans multiple repos. Agents that assume one repo = one domain will produce a broken graph. The `domains.md` registry exists precisely to prevent this.
- **Module inference fragility** — Inferring which module a component belongs to requires a priority chain (code signal -> path rule -> name convention -> fallback). Skipping straight to name guessing produces noisy, unreliable graphs.
- **Orphans as diagnostic signal** — Orphaned components (>20% of total) almost always indicate a systematic linking failure in Step 4, not individual missed links. Fixing orphans one-by-one when the root cause is a pattern gap wastes significant time.

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
