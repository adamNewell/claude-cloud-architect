# Archimedes

AI-assisted architecture intelligence platform for software modernization consulting. Layers three tiers of analysis — deterministic, semantic, and agentic — connected by a persistent SQLite tag store that accumulates findings across sessions.

## Architecture

```
Tier 1 (Deterministic)  →  ast-grep structural pattern matching       (confidence 0.95/0.70)
Tier 2 (Semantic)       →  ColGREP/qmd semantic indexing + search     (confidence 0.50/0.60)
Tier 3 (Agentic)        →  osgrep role classification + Serena LSP    (confidence 0.70)
                         ↓
                    SQLite Tag Store
                    (.archimedes/sessions/{session-id}/tags.db)
                         ↓
                    Rivière Flow Schemas + Deliverables
```

## Commands

| Command             | Purpose                                                                     |
| ------------------- | --------------------------------------------------------------------------- |
| `/arch-tag`         | Tag store operations — query, promote, export architectural knowledge       |
| `/arch-assess`      | Single-repo or multi-repo service profile: API surface, dependencies, roles |
| `/arch-modernize`   | Full autonomous modernization assessment with human review gates            |
| `/arch-investigate` | Open-ended investigation: ask a question, get evidence from the codebase    |

## Skills

| Skill            | Tool Wrapped         | Tag Kinds              | Confidence               |
| ---------------- | -------------------- | ---------------------- | ------------------------ |
| `arch-tags`      | tag-store.ts         | CRUD meta-skill        | —                        |
| `arch-structure` | ast-grep             | PATTERN, DEPENDENCY    | 0.95 (IaC) / 0.70 (code) |
| `arch-search`    | code-chunk + ColGREP | DEPENDENCY, CAPABILITY | 0.50                     |
| `arch-docs`      | qmd + rlmgrep        | FLOW, DEBT, RISK       | 0.60                     |
| `arch-observe`   | osgrep               | ROLE, DEPENDENCY, DEBT | 0.70                     |
| `arch-navigate`  | Serena LSP           | DEPENDENCY, ROLE       | 0.70                     |
| `arch-flows`     | Rivière CLI          | FLOW, BOUNDARY         | human-weight             |
| `arch-modernize` | All tiers            | Orchestration          | multi-step               |

## Tag Store

All findings live in `.archimedes/sessions/{session-id}/tags.db` — a portable SQLite database you can query, export, and deliver to clients.

**Weight classes:**
- `HUMAN` — Deterministic findings (ast-grep). Written as VALIDATED immediately.
- `MACHINE` — Probabilistic findings (semantic/agentic). Written as CANDIDATE.
- `PROMOTED` — Machine findings reviewed and approved by a human via `/arch-tag promote`.

**Confidence gradient:**
- IaC declarations: 0.95
- Docker/K8s/service mesh: 0.85/0.80
- Code imports: 0.70
- Documentation references: 0.60
- Semantic similarity: 0.50

## Deliverables

`/arch-modernize` generates 5 deliverables:
1. **Architecture Map** — Rivière flow schema + Éclair visualization
2. **Service Profiles** — Per-repo API surface, dependencies, modernization readiness score
3. **Technical Debt Assessment** — Classified DEBT tags with evidence links
4. **Modernization Roadmap** — Prioritized recommendations with dependency ordering
5. **Tag Store Export** — Portable SQLite database

## Guardrails

- Autonomous skills write only CANDIDATE/MACHINE-weight tags
- PROMOTED status requires human review via `/arch-tag promote`
- All confidence levels reported explicitly
- Conflicting evidence surfaced, never suppressed
- Sessions are time-bounded (configurable, default 60min)
- Agents operate within session-registered repo scope only

## Cookbook

| Need                       | Load                                                            |
| -------------------------- | --------------------------------------------------------------- |
| ast-grep flags + patterns  | `cookbook/ast-grep/cli.md`, `cookbook/ast-grep/patterns.md`     |
| Tag store schema + queries | `cookbook/tag-store/schema.md`, `cookbook/tag-store/queries.md` |
| ColGREP indexing + search  | `cookbook/colgrep/cli.md`                                       |
| osgrep role classification | `cookbook/osgrep/cli.md`                                        |
| Serena LSP MCP tools       | `cookbook/serena/cli.md`                                        |

## Quick Start

```bash
# Initialize session and assess a single repo
just arch-quick /path/to/repo

# Full modernization assessment
just arch-full /path/to/repo1 /path/to/repo2 /path/to/iac

# Query the tag store
just arch-tag-query "SELECT * FROM tags WHERE kind = 'PATTERN' AND status = 'VALIDATED'"

# Review and promote machine findings
/arch-tag promote --session <session-id>
```
