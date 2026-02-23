---
description: Tag store CRUD — read, write, query, promote, reject, export architectural findings
---
# arch-tags

The tag store is the shared memory between all Archimedes skills. Every skill reads from and writes to it. `arch-tags` provides the operations to interact with it directly.

## Commands

### init — Create a new tag store

```bash
bun tools/tag-store.ts init --session <session_id> --db <db_path>
# or using default path (.archimedes/sessions/<session_id>/tags.db):
bun tools/tag-store.ts init --session <session_id>
```

Returns: `{"ok": true, "session": "<session_id>"}`

### write — Write a tag

```bash
bun tools/tag-store.ts write \
  --session <session_id> \
  --db <db_path> \
  --kind PATTERN \
  --target-ref /path/to/file.ts \
  --target-repo /path/to/repo \
  --value '{"pattern_name":"lambda-handler","subkind":"lambda-handler"}' \
  --confidence 0.95 \
  --weight HUMAN \
  --source-tool ast-grep
```

Returns: `{"ok": true, "id": "<uuid>"}` — returns same id on duplicate (deduplication by target_ref+kind+source_tool+session_id)

### query — Run SQL against the tag store

```bash
bun tools/tag-store.ts query \
  --session <session_id> \
  --db <db_path> \
  --sql "SELECT kind, COUNT(*) FROM tags GROUP BY kind"
```

Returns: JSON array of rows. See `cookbook/tag-store/queries.md` for 22 ready-to-use templates.

### promote — Promote a CANDIDATE tag to PROMOTED (human-reviewed)

```bash
bun tools/tag-store.ts promote --db <db_path> --id <tag_id>
```

### reject — Reject a false-positive tag

```bash
bun tools/tag-store.ts reject --db <db_path> --id <tag_id>
```

### export — Export all non-rejected tags from a session as JSON

```bash
bun tools/tag-store.ts export --session <session_id> --db <db_path>
```

## Common Queries

### All PATTERN tags for a repo
```sql
SELECT * FROM tags
WHERE target_repo = '/path/to/repo'
  AND kind = 'PATTERN'
  AND status != 'REJECTED'
ORDER BY confidence DESC;
```

### CANDIDATE tags pending review
```sql
SELECT id, target_ref, kind,
       json_extract(value, '$.subkind') as subkind,
       confidence, source_tool
FROM tags
WHERE status = 'CANDIDATE'
ORDER BY confidence DESC;
```

### Tag count by kind and status
```sql
SELECT kind, status,
       COUNT(*) as count,
       ROUND(AVG(confidence), 2) as avg_confidence
FROM tags
GROUP BY kind, status
ORDER BY kind, status;
```

### Technology stack summary
```sql
SELECT json_extract(value, '$.pattern_name') as pattern,
       json_extract(value, '$.subkind') as subkind,
       COUNT(*) as count,
       ROUND(AVG(confidence), 2) as avg_confidence
FROM tags
WHERE kind = 'PATTERN'
  AND status != 'REJECTED'
GROUP BY 1, 2
ORDER BY count DESC;
```

### Tags per file (density heatmap)
```sql
SELECT target_ref,
       COUNT(*) as tag_count,
       GROUP_CONCAT(DISTINCT kind) as kinds,
       ROUND(MAX(confidence), 2) as max_confidence
FROM tags
WHERE status != 'REJECTED'
GROUP BY target_ref
ORDER BY tag_count DESC
LIMIT 50;
```

### Top debt by confidence
```sql
SELECT target_ref,
       json_extract(value, '$.subkind') as debt_type,
       json_extract(value, '$.note') as note,
       confidence,
       source_tool
FROM tags
WHERE kind = 'DEBT'
  AND status != 'REJECTED'
ORDER BY confidence DESC
LIMIT 20;
```

### Debt tags by file for prioritization
```sql
SELECT target_ref,
       COUNT(*) as debt_count,
       MAX(confidence) as max_confidence,
       GROUP_CONCAT(json_extract(value, '$.subkind'), ', ') as debt_types
FROM tags
WHERE kind = 'DEBT'
  AND status != 'REJECTED'
GROUP BY target_ref
ORDER BY debt_count DESC, max_confidence DESC;
```

### All dependencies from a repo
```sql
SELECT target_ref,
       json_extract(value, '$.subkind') as dep_type,
       source_tool,
       confidence,
       status
FROM tags
WHERE kind = 'DEPENDENCY'
  AND target_repo = '/path/to/repo'
  AND status != 'REJECTED'
ORDER BY dep_type, target_ref;
```

### Human-weight facts only (deterministic ground truth)
```sql
SELECT * FROM tags
WHERE weight_class IN ('HUMAN', 'PROMOTED')
  AND status = 'VALIDATED'
ORDER BY target_repo, kind, target_ref;
```

### Find files with both PATTERN and DEBT tags
```sql
SELECT p.target_ref,
       json_extract(p.value, '$.subkind') as pattern,
       json_extract(d.value, '$.subkind') as debt,
       d.confidence as debt_confidence
FROM tags p
JOIN tags d ON p.target_ref = d.target_ref
             AND p.session_id = d.session_id
WHERE p.kind = 'PATTERN'
  AND d.kind = 'DEBT'
  AND p.status != 'REJECTED'
  AND d.status != 'REJECTED'
ORDER BY d.confidence DESC;
```

## Tag Lifecycle

```
CANDIDATE → VALIDATED → PROMOTED
    ↓             ↓
 REJECTED      STALE
```

- **CANDIDATE**: Machine-weight tag awaiting review
- **VALIDATED**: Automatically set for HUMAN-weight tags (deterministic findings)
- **PROMOTED**: CANDIDATE reviewed and confirmed by a human via `promote`
- **REJECTED**: False positive, excluded from queries and exports
- **STALE**: Tag superseded by a newer scan

## Weight Classes

| Weight Class | Source | Starting Status | Requires Review? |
|---|---|---|---|
| HUMAN | Deterministic tools (ast-grep) | VALIDATED | No |
| MACHINE | Probabilistic tools (ColGREP, osgrep) | CANDIDATE | Yes |
| PROMOTED | Reviewed MACHINE tag | PROMOTED | Was reviewed |

## DB Path Convention

Default: `.archimedes/sessions/<session_id>/tags.db`

Always read `meta.json` for the authoritative path:
```bash
cat .archimedes/sessions/<session_id>/meta.json | jq .db_path
```
