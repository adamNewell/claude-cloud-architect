---
name: arch-tags
description: Tag store CRUD and review workflows for the Archimedes architectural knowledge store. Use when: checking what scan found, reviewing CANDIDATE tags for promotion or rejection, querying architectural findings, exporting results, writing custom tags, or managing the tag lifecycle. Keywords: tag, tags, tag store, query tags, promote, reject, export, review findings, CANDIDATE, VALIDATED, PROMOTED, REJECTED, confidence, weight_class, session.
---
# arch-tags

The tag store is shared memory between all Archimedes skills. Every skill reads from and writes to it. The correctness of downstream analysis depends entirely on the quality of tags in the store.

## When to Use Which Command

| You want to… | Command |
|---|---|
| See what a scan found / start a review session | `query` |
| A CANDIDATE tag is correct | `promote` |
| A CANDIDATE tag is wrong | `reject` |
| Deliver findings to a client | `export` |
| Add a finding no pattern covers | `write` with `--weight MACHINE` |
| Start a new analysis session | `session-init` (not arch-tags directly) |

> **MANDATORY: READ ENTIRE FILE `references/tag-review-workflow.md` BEFORE querying** when conducting a full review session. Do NOT load it for single targeted queries (e.g., `SELECT COUNT(*) FROM tags`).

**Decision: promote vs reject vs ignore**
- `promote` — you verified the `source_evidence` matches what's actually in the source file
- `reject` — the pattern matched but the finding is a false positive; this excludes it permanently
- Leave it — if you genuinely cannot tell from the evidence, do not promote uncertain findings

## Pre-flight: Resolve $SESSION and $DB_PATH

All commands require `$SESSION` (session ID) and `$DB_PATH` (database path). Always resolve `$DB_PATH` from `meta.json` — do not construct it manually:

```bash
DB_PATH=$(cat /path/to/repo/.archimedes/sessions/$SESSION/meta.json | jq -r .db_path)
```

Default if `meta.json` is absent: `.archimedes/sessions/$SESSION/tags.db` inside the analyzed repo root.

## Commands

### query — Run SQL against the tag store

```bash
bun tools/tag-store.ts query \
  --session $SESSION \
  --db $DB_PATH \
  --sql "SELECT kind, COUNT(*) FROM tags GROUP BY kind"
```

**MANDATORY before writing custom SQL: read `cookbook/tag-store/queries.md`** (22 ready-to-use templates). Do NOT load `cookbook/tag-store/schema.md` unless troubleshooting a column type or unexpected null value.

### write — Write a tag

```bash
# PATTERN tag (use $.pattern_name + $.subkind)
bun tools/tag-store.ts write \
  --session $SESSION \
  --db $DB_PATH \
  --kind PATTERN \
  --target-ref /path/to/file.ts \
  --target-repo /path/to/repo \
  --value '{"pattern_name":"custom-finding","subkind":"manual","line":42}' \
  --confidence 0.70 \
  --weight MACHINE \
  --source-tool manual

# DEPENDENCY tag (use $.subkind + $.line)
bun tools/tag-store.ts write \
  --session $SESSION \
  --db $DB_PATH \
  --kind DEPENDENCY \
  --target-ref /path/to/file.ts \
  --target-repo /path/to/repo \
  --value '{"subkind":"dynamodb-client","line":12}' \
  --confidence 0.70 \
  --weight MACHINE \
  --source-tool manual
```

Returns: `{"ok": true, "id": "<uuid>"}` — returns same id on duplicate (deduplication by target_ref+kind+source_tool+session_id+source_query). A duplicate return is success, not an error.

**Confidence guidelines — these thresholds have real meaning:**
- 0.95 — deterministic detection (ast-grep exact match on a known pattern)
- 0.70 — confident code inspection you can point to specific lines
- 0.50 — semantic inference (ColGREP, osgrep) where you matched intent, not syntax
- Never 1.0 for MACHINE-weight tags: 1.0 is reserved for system-verified ground truth; MACHINE implies probabilistic detection

**`--weight HUMAN` vs `--weight MACHINE`**: Use `--weight HUMAN` only when you personally verified the finding exists in the current source file and want to record it as ground truth (starting status: VALIDATED, no review needed). Use `--weight MACHINE` for all inferred or automated findings (starting status: CANDIDATE, requires review). When in doubt, use MACHINE.

### promote / reject

```bash
bun tools/tag-store.ts promote --db $DB_PATH --tag-id <tag_id>
bun tools/tag-store.ts reject --db $DB_PATH --tag-id <tag_id>
```

Don't promote under time pressure — an unreviewed CANDIDATE is safer than a wrongly-promoted finding. When five or more tags from the same `source_tool` are all wrong on similar files, batch-reject them.

### export — Export all non-rejected tags as JSON

```bash
bun tools/tag-store.ts export --session $SESSION --db $DB_PATH
# Output goes to stdout — redirect to a file if needed:
bun tools/tag-store.ts export --session $SESSION --db $DB_PATH > export.json
```

Prints JSON to stdout. CANDIDATE tags are included in the export — they represent **unreviewed findings**. When delivering to clients or downstream consumers, filter to `WHERE status IN ('VALIDATED','PROMOTED')` unless the consumer explicitly wants unreviewed candidates.

## NEVER

- **NEVER run INSERT, UPDATE, or DELETE through the `query` command.** Use `write`, `promote`, and `reject` instead. The query command has no write safeguards; a stray UPDATE can corrupt the entire session's findings silently.
- **NEVER omit `status NOT IN ('REJECTED')` in WHERE clauses.** REJECTED tags are permanently excluded from analysis. Including them inflates counts, poisons technology stack summaries, and produces wrong prioritization rankings.
- **NEVER write confidence=1.0 for MACHINE-weight tags.** 1.0 signals ground truth (system-verified). MACHINE tags are probabilistic by definition — they matched a pattern, not a verified fact. Use 0.50–0.90 for MACHINE.
- **NEVER promote without reading `source_evidence`.** The evidence field contains the actual matched code. If source_evidence doesn't exist in the current source file (code was refactored), the tag is stale, not a valid promotion candidate.
- **NEVER write tags manually when a pattern pack covers the same pattern.** Pattern packs are reproducible and deduplication-aware; manual write tags are one-off and may conflict with scan tags on the same target_ref.
- **NEVER interpret zero CANDIDATE tags as "nothing needs review."** It means no MACHINE-weight tools have run yet (only ast-grep patterns ran). Tier 2 and Tier 3 skills generate CANDIDATE tags.
- **NEVER reuse a session ID for a different repository.** Session IDs are bound to the repos registered at init time. Reusing a session ID across repos contaminates findings: tags from repo A appear when querying repo B, producing fabricated dependency and pattern data.
- **NEVER deliver an export as final findings without completing the CANDIDATE review first.** Exports include CANDIDATE tags by default — unreviewed findings that have not been verified against source code. Complete the review workflow in `references/tag-review-workflow.md` before exporting for clients.

## Tag Lifecycle

```
CANDIDATE → PROMOTED  (human reviewed: correct)
    ↓
 REJECTED              (human reviewed: false positive)

ast-grep writes → VALIDATED  (deterministic: no review needed)
VALIDATED → STALE             (superseded by newer scan; set by orchestrator only)
```

The critical distinction: HUMAN-weight tags (ast-grep) start as VALIDATED and never need review. MACHINE-weight tags start as CANDIDATE and require human judgment before any downstream analysis treats them as fact.

## Weight Classes

| Weight Class | Source | Starting Status | Requires Review? |
|---|---|---|---|
| HUMAN | Deterministic tools (ast-grep pattern packs) or manually verified findings | VALIDATED | No |
| MACHINE | Probabilistic tools (ColGREP, osgrep, qmd) or unverified manual tags | CANDIDATE | Yes |
| PROMOTED | Human-reviewed MACHINE tag | PROMOTED | Already reviewed |

## Error Handling

| Symptom | Root Cause | Fix |
|---|---|---|
| `no such table: tags` | Wrong `--db` path or wrong working directory | Read `meta.json`: `cat .archimedes/sessions/<id>/meta.json \| jq .db_path` |
| `{"ok":true,"id":"<same-id>"}` on write | Deduplication fired — not an error | Treat as success; the existing tag was updated |
| `session not found` | `--session` ID not initialized | Run `bun tools/session-init.ts --session <id> --repo /path` first |
| Empty result from query | REJECTED filter excluded all matches, or wrong session | Add session filter; verify with `SELECT COUNT(*) FROM tags` |
| `source_evidence` doesn't match file | Code was refactored after scan | Reject the tag; re-scan to get current state |
| Export consumer sees unexpected CANDIDATE tags | Unfiltered export delivered | Re-export with `WHERE status IN ('VALIDATED','PROMOTED')` and re-deliver; note filtering in delivery message |

