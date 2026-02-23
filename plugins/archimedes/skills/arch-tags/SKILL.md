---
name: arch-tags
description: Tag store CRUD and review workflows for the Archimedes architectural knowledge store. Use when: checking what scan found, reviewing CANDIDATE tags for promotion or rejection, querying architectural findings, exporting results, writing custom tags, or managing the tag lifecycle. Keywords: tag, tags, tag store, query tags, promote, reject, export, review findings, CANDIDATE, VALIDATED, PROMOTED, REJECTED, confidence, weight_class, session.
---
# arch-tags

The tag store is shared memory between all Archimedes skills. Every skill reads from and writes to it. The correctness of downstream analysis depends entirely on the quality of tags in the store.

## When to Use Which Command

| You want to… | Command |
|---|---|
| See what a scan found | `query` — start with the 3-query review sequence below |
| A CANDIDATE tag is correct | `promote` |
| A CANDIDATE tag is wrong | `reject` |
| Deliver findings to a client | `export` |
| Add a finding no pattern covers | `write` with `--weight MACHINE` |
| Start a new analysis session | `session-init` (not arch-tags directly) |

**Decision: promote vs reject vs ignore**
- `promote` — you verified the `source_evidence` matches what's actually in the source file
- `reject` — the pattern matched but the finding is a false positive; this excludes it permanently
- Leave it — if you genuinely cannot tell from the evidence, do nothing; don't promote uncertain findings

## Commands

### query — Run SQL against the tag store

```bash
bun tools/tag-store.ts query \
  --session <session_id> \
  --db <db_path> \
  --sql "SELECT kind, COUNT(*) FROM tags GROUP BY kind"
```

**MANDATORY before writing custom SQL: read `cookbook/tag-store/queries.md`** (22 ready-to-use templates). Do NOT load `cookbook/tag-store/schema.md` unless troubleshooting column types or values.

**Ordered review sequence — run these three first, every time:**
1. `SELECT kind, COUNT(*) as count, ROUND(AVG(confidence),2) as avg_conf FROM tags WHERE status NOT IN ('REJECTED') GROUP BY kind` — scope check
2. `SELECT json_extract(value,'$.pattern_name') as p, COUNT(*) FROM tags WHERE kind='PATTERN' AND status NOT IN ('REJECTED') GROUP BY 1 ORDER BY 2 DESC` — technology stack
3. `SELECT id, target_ref, kind, json_extract(value,'$.subkind') as subkind, confidence FROM tags WHERE status='CANDIDATE' ORDER BY confidence DESC` — what needs review

### write — Write a tag

```bash
bun tools/tag-store.ts write \
  --session <session_id> \
  --db <db_path> \
  --kind PATTERN \
  --target-ref /path/to/file.ts \
  --target-repo /path/to/repo \
  --value '{"pattern_name":"custom-finding","subkind":"manual"}' \
  --confidence 0.70 \
  --weight MACHINE \
  --source-tool manual
```

Returns: `{"ok": true, "id": "<uuid>"}` — returns same id on duplicate (deduplication by target_ref+kind+source_tool+session_id+source_query). A duplicate return is success, not an error.

**Confidence guidelines — these thresholds have real meaning:**
- 0.95 — deterministic detection (ast-grep exact match on a known pattern)
- 0.70 — confident code inspection finding you can point to specific lines
- 0.50 — semantic inference (ColGREP, osgrep) where you matched intent, not syntax
- Never 1.0 for MACHINE-weight tags: 1.0 is reserved for system-verified ground truth; MACHINE implies probabilistic detection

### promote / reject

```bash
bun tools/tag-store.ts promote --db <db_path> --id <tag_id>
bun tools/tag-store.ts reject --db <db_path> --id <tag_id>
```

If five tags from the same `source_tool` are all wrong on similar files, batch-reject by running `query` to find their ids then rejecting each. Don't promote under time pressure — an unreviewed CANDIDATE is safer than a wrongly-promoted finding.

### export — Export all non-rejected tags as JSON

```bash
bun tools/tag-store.ts export --session <session_id> --db <db_path>
```

Writes JSON to `.archimedes/sessions/<session_id>/export.json`. Only CANDIDATE, VALIDATED, and PROMOTED tags are included — REJECTED are automatically excluded.

## NEVER

- **NEVER run INSERT, UPDATE, or DELETE through the `query` command.** Use `write`, `promote`, and `reject` instead. The query command has no write safeguards; a stray UPDATE can corrupt the entire session's findings silently.
- **NEVER omit `status NOT IN ('REJECTED')` in WHERE clauses.** REJECTED tags are permanently excluded from analysis. Including them inflates counts, poisons technology stack summaries, and produces wrong prioritization rankings.
- **NEVER write confidence=1.0 for MACHINE-weight tags.** 1.0 signals ground truth (system-verified). MACHINE tags are probabilistic by definition — they matched a pattern, not a verified fact. Use 0.50–0.90 for MACHINE.
- **NEVER promote without reading `source_evidence`.** The evidence field contains the actual matched code. If source_evidence doesn't exist in the current source file (code was refactored), the tag is stale, not valid.
- **NEVER write tags manually when a pattern pack covers the same pattern.** Pattern packs are reproducible and deduplication-aware; manual write tags are one-off and may conflict with scan tags on the same target_ref.
- **NEVER interpret zero CANDIDATE tags as "nothing needs review."** It means no MACHINE-weight tools have run yet (only ast-grep patterns ran). Tier 2 and Tier 3 skills generate CANDIDATE tags.
- **NEVER reuse a session ID for a different repository.** Session IDs are bound to the repos registered at init time. Reusing a session ID across repos contaminates findings: tags from repo A appear when querying repo B, producing fabricated dependency and pattern data.

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
| HUMAN | Deterministic tools (ast-grep pattern packs) | VALIDATED | No |
| MACHINE | Probabilistic tools (ColGREP, osgrep, qmd) | CANDIDATE | Yes |
| PROMOTED | Human-reviewed MACHINE tag | PROMOTED | Already reviewed |

## Error Handling

| Symptom | Root Cause | Fix |
|---|---|---|
| `no such table: tags` | Wrong `--db` path or wrong working directory | Read `meta.json`: `cat .archimedes/sessions/<id>/meta.json \| jq .db_path` |
| `{"ok":true,"id":"<same-id>"}` on write | Deduplication fired — not an error | Treat as success; the existing tag was updated |
| `session not found` | `--session` ID not initialized | Run `bun tools/session-init.ts --session <id> --repo /path` first |
| Empty result from query | REJECTED filter excluded all matches, or wrong session | Add session filter; verify with COUNT(*) query |
| `source_evidence` doesn't match file | Code was refactored after scan | Reject the tag; re-scan to get current state |

## DB Path Convention

Default: `.archimedes/sessions/<session_id>/tags.db` inside the analyzed repo root.

Always resolve the authoritative path from meta.json, not by constructing it manually:
```bash
cat /path/to/repo/.archimedes/sessions/<session_id>/meta.json | jq .db_path
```
