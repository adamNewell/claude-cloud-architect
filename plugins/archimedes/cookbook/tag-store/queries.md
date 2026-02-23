# Tag Store SQL Query Templates

All queries run against `.archimedes/sessions/<session_id>/tags.db`.

Run a query from the CLI:
```bash
bun run tools/tag-store.ts query --session SESSION_ID \
  --sql "SELECT COUNT(*) FROM tags"
```

Or against a specific database file:
```bash
bun run tools/tag-store.ts query --db /path/to/tags.db \
  --sql "SELECT COUNT(*) FROM tags"
```

---

## Basic Lookups

### All PATTERN tags for a repo
```sql
SELECT * FROM tags
WHERE target_repo = '/path/to/repo'
  AND kind = 'PATTERN'
  AND status != 'REJECTED'
ORDER BY confidence DESC;
```

### All tags for a single file
```sql
SELECT id, kind, json_extract(value, '$.subkind') as subkind,
       confidence, status, source_tool
FROM tags
WHERE target_ref = 'src/handlers/user.ts'
  AND status != 'REJECTED'
ORDER BY kind, confidence DESC;
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

### Human-weight facts only (deterministic ground truth)
```sql
SELECT * FROM tags
WHERE weight_class IN ('HUMAN', 'PROMOTED')
  AND status = 'VALIDATED'
ORDER BY target_repo, kind, target_ref;
```

### Tags written by ast-grep in this session
```sql
SELECT * FROM tags
WHERE source_tool = 'ast-grep'
  AND session_id = 'SESSION_ID'
ORDER BY created_at DESC;
```

---

## Aggregation and Summaries

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

### Count tags by source tool
```sql
SELECT source_tool,
       COUNT(*) as total,
       ROUND(AVG(confidence), 2) as avg_confidence,
       SUM(CASE WHEN status = 'CANDIDATE' THEN 1 ELSE 0 END) as pending_review
FROM tags
WHERE status != 'REJECTED'
GROUP BY source_tool
ORDER BY total DESC;
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

---

## Debt and Risk Analysis

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

### All DEBT tags with notes
```sql
SELECT target_ref,
       json_extract(value, '$.subkind') as debt_type,
       json_extract(value, '$.note') as note,
       confidence,
       status
FROM tags
WHERE kind = 'DEBT'
  AND json_extract(value, '$.note') IS NOT NULL
ORDER BY confidence DESC;
```

### Risk tags across all repos
```sql
SELECT target_repo, target_ref,
       json_extract(value, '$.subkind') as risk_type,
       json_extract(value, '$.note') as note,
       confidence
FROM tags
WHERE kind = 'RISK'
  AND status != 'REJECTED'
ORDER BY confidence DESC;
```

---

## Dependency Queries

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

### Lambda handlers across all repos
```sql
SELECT target_ref, target_repo,
       json_extract(value, '$.subkind') as subkind,
       json_extract(value, '$.language') as language,
       confidence
FROM tags
WHERE kind = 'PATTERN'
  AND json_extract(value, '$.subkind') LIKE 'lambda-handler%'
  AND status != 'REJECTED'
ORDER BY target_repo, target_ref;
```

---

## Confidence Filtering

### Find tags with confidence above a threshold
```sql
SELECT target_ref, kind,
       json_extract(value, '$.subkind') as subkind,
       confidence, status
FROM tags
WHERE confidence >= 0.85
  AND status != 'REJECTED'
ORDER BY confidence DESC;
```

### Low-confidence candidates worth reviewing
```sql
SELECT target_ref, kind,
       json_extract(value, '$.subkind') as subkind,
       confidence, source_tool
FROM tags
WHERE status = 'CANDIDATE'
  AND confidence < 0.60
ORDER BY confidence ASC;
```

---

## Cross-Session and Temporal Queries

### Find duplicate tags across sessions (same file + kind + tool)
```sql
SELECT target_ref, kind, source_tool,
       COUNT(DISTINCT session_id) as session_count,
       GROUP_CONCAT(session_id, ', ') as sessions
FROM tags
WHERE status != 'REJECTED'
GROUP BY target_ref, kind, source_tool
HAVING session_count > 1
ORDER BY session_count DESC;
```

### Find tags recently updated (last N hours)
```sql
-- Replace 6 with the number of hours
SELECT id, target_ref, kind,
       json_extract(value, '$.subkind') as subkind,
       status, updated_at
FROM tags
WHERE updated_at >= datetime('now', '-6 hours')
ORDER BY updated_at DESC;
```

### Repos with no PATTERN tags (potential blind spots)
```sql
SELECT DISTINCT t1.target_repo
FROM tags t1
WHERE t1.target_repo NOT IN (
  SELECT DISTINCT target_repo FROM tags
  WHERE kind = 'PATTERN' AND status != 'REJECTED'
)
ORDER BY t1.target_repo;
```

---

## Hierarchical and Relational Queries

### Get tags by parent_tag_id (children of a tag)
```sql
SELECT id, target_ref, kind,
       json_extract(value, '$.subkind') as subkind,
       confidence, status
FROM tags
WHERE parent_tag_id = 'PARENT_TAG_UUID'
ORDER BY confidence DESC;
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

---

## Export and Maintenance

### Export a session's tags to JSON
```bash
# Using the built-in export command (excludes REJECTED tags)
bun run tools/tag-store.ts export --session SESSION_ID

# Or via query for all statuses including REJECTED
bun run tools/tag-store.ts query --session SESSION_ID \
  --sql "SELECT * FROM tags WHERE session_id='SESSION_ID' ORDER BY created_at"
```

### Full-text search on value JSON
```sql
-- Find tags mentioning a specific term in their value blob
SELECT target_ref, kind, value, confidence
FROM tags
WHERE value LIKE '%dynamodb%'
  AND status != 'REJECTED';
```

### Promote all validated MACHINE tags to PROMOTED
```sql
-- Useful after a bulk review pass; run via query command
UPDATE tags
SET status = 'PROMOTED',
    weight_class = 'PROMOTED',
    updated_at = datetime('now')
WHERE status = 'VALIDATED'
  AND weight_class = 'MACHINE'
  AND session_id = 'SESSION_ID';
```

### Mark stale tags from a removed file
```sql
UPDATE tags
SET status = 'STALE',
    updated_at = datetime('now')
WHERE target_ref = 'src/handlers/deleted-file.ts'
  AND session_id = 'SESSION_ID';
```
