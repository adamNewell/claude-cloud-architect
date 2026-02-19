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
| qmd search, collections, embeddings (Phase 0B)                    | `cookbook/Qmd.md`              |
| builder commands: init, add-component, link, enrich, validate     | `cookbook/RiviereBuilder.md`   |
| query commands: domains, components, trace, orphans, search       | `cookbook/RiviereQuery.md`     |
| extract commands                                                  | `cookbook/RiviereExtract.md`   |
| command index, exit codes, concurrency rules, phase mapping       | `cookbook/RiviereCli.md`       |

Load only the cookbook you need — do not load all unless working across tools.

## Variables

WIKI_DATA: $1 -- Default: NONE

## Workflow

<IF: WIKI_DATA>
    Verify if it is a single document, a single document set, or a directory containing full system documentation. Proceed to Phase 1.
<ELSE>
    Ask user if they would like to generate wiki data from the system.
    - If yes: Read `references/phase-0a-orchestrator.md` (Generate Wiki), then `references/phase-0b-orchestrator.md` (Register with qmd), then proceed to Phase 1.
    - If no or wiki already exists: Proceed to Phase 1.
<ENDIF>

### Phase 0A - Generate Wiki (Optional) [IGNORE PHASE 0A]

Read `references/phase-0a-orchestrator.md`

### Phase 0B - Register Wiki via qmd (Optional)

Read `references/phase-0b-orchestrator.md`

### Entry Point

Read `references/phase-1-orchestrator.md` to begin.

Phases 2–6 are self-chaining — each phase document tells you what to load next.
