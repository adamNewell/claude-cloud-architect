---
name: riviere-architect
description: Document and capture existing software architecture. USE WHEN documenting architecture, capturing system design using Rivière from living-architecture.dev
---

# Riviere Architect

## Purpose

Explore an existing codebase or system and produce a comprehensive, structured architecture graph

## Tool Reference

When you need command syntax or options during any phase, load the relevant cookbook:

| Need                                                              | Load                           |
| ----------------------------------------------------------------- | ------------------------------ |
| qmd search, collections, embeddings (Wiki Index)                    | `cookbook/Qmd.md`              |
| builder commands: init, add-component, link, enrich, validate     | `cookbook/RiviereBuilder.md`   |
| query commands: domains, components, trace, orphans, search       | `cookbook/RiviereQuery.md`     |
| extract commands                                                  | `cookbook/RiviereExtract.md`   |
| command index, exit codes, concurrency rules, phase mapping       | `cookbook/RiviereCli.md`       |

Load only the cookbook you need — do not load all unless working across tools.

## Variables

WIKI_DATA: $1 -- Default: NONE

## Workflow

<IF: WIKI_DATA>
    Verify if it is a single document, a single document set, or a directory containing full system documentation. Proceed to Explore.
<ELSE>
    Ask user if they would like to generate wiki data from the system.
    - If yes: Read `steps/wiki-build.md` (Generate Wiki), then `steps/wiki-index.md` (Register with qmd), then proceed to Explore.
    - If no or wiki already exists: Proceed to Explore.
<ENDIF>

### Wiki Build — Generate Wiki (Optional)

Read `steps/wiki-build.md`

### Wiki Index - Register Wiki via qmd (Optional)

Read `steps/wiki-index.md`

### Entry Point

Read `steps/explore-orchestrator.md` to begin.

Steps are self-chaining — each step document tells you what to load next.
