---
name: extract-architecture
description: 'Extract, map, and document existing software architecture as a structured component graph using Rivière (living-architecture.dev). USE WHEN: reverse-engineering a codebase, creating an architecture diagram, mapping domains and services, discovering bounded contexts, documenting how components connect, or understanding how a system is structured. Produces a queryable graph of APIs, use cases, domain operations, events, and their links.'
---

# Riviere Architect

## Purpose

Explore an existing codebase or system and produce a comprehensive, structured architecture graph

## Tool Reference

When you need command syntax or options during any phase, load the relevant cookbook:

| Need                                                          | Load                          |
| ------------------------------------------------------------- | ----------------------------- |
| qmd collections, context, embeddings (Wiki Index)             | `cookbook/qmd/cli.md`         |
| command index, exit codes, concurrency rules, phase mapping   | `cookbook/riviere/cli.md`     |


Load only the cookbook you need — do not load all unless working across tools.

## Variables

WIKI_DATA: $1 -- Default: NONE

**NEVER** call `add-component`, `enrich`, or `link` from subagents — concurrent writes corrupt the graph. Workers write staged JSONL; the coordinator serializes all CLI calls.
**NEVER** invent domain names — always check `.riviere/config/domains.md` first.
**NEVER** use plan mode in extraction steps — execute directly.
**NEVER** proceed to the next step without user confirmation.

## Workflow

<IF: WIKI_DATA>
Verify if it is a single document, a single document set, or a directory containing full system documentation. Proceed to Explore.
<ELSE>
Ask user if they would like to generate wiki data from the system. - If yes: Read `steps/wiki-build.md` (Generate Wiki), then `steps/wiki-index.md` (Register with qmd), then proceed to Explore. - If no or wiki already exists: Proceed to Explore.
<ENDIF>

### Wiki Build — Generate Wiki (Optional)

Read `steps/wiki-build.md`

### Wiki Index - Register Wiki via qmd (Optional)

Read `steps/wiki-index.md`

### Entry Point

Read `steps/explore-orchestrator.md` to begin.

Steps are self-chaining — each step document tells you what to load next.
