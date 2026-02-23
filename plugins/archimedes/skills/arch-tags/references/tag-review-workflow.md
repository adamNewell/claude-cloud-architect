# Tag Review Workflow

This file contains the complete step-by-step review workflow for tag store sessions. Load this file at the start of any review session — do not rely on memory for the query sequence or decision logic.

## Pre-Flight: Confirm Session Scope

Before starting a review, verify you're looking at the right session and repo. Cross-session contamination produces silently wrong counts:

```sql
-- Confirm which sessions and repos are in this DB
SELECT session_id, target_repo, COUNT(*) as tags
FROM tags
GROUP BY session_id, target_repo
ORDER BY tags DESC
```

If you see multiple session_ids or repos: use explicit `AND session_id = '<SESSION>' AND target_repo = '<REPO>'` filters in all queries below.

## The 4-Step Review Sequence

### Step 1 — Scope Check

```sql
SELECT kind, COUNT(*) as count, ROUND(AVG(confidence),2) as avg_conf
FROM tags
WHERE session_id = '<SESSION>'
  AND target_repo = '<REPO>'
  AND status NOT IN ('REJECTED')
GROUP BY kind
```

Interpret: DEBT count > 20% of PATTERN count = systemic technical debt worth flagging. CANDIDATE count > 0 = Tier 2/3 tools have run and findings need review.

### Step 2 — Technology Stack

```sql
SELECT json_extract(value,'$.pattern_name') as pattern,
       json_extract(value,'$.subkind') as subkind,
       COUNT(*) as count
FROM tags
WHERE session_id = '<SESSION>'
  AND target_repo = '<REPO>'
  AND kind = 'PATTERN'
  AND status NOT IN ('REJECTED')
GROUP BY 1, 2
ORDER BY count DESC
```

Interpret: Unexpected patterns (a web service showing `mqtt-subscribe`) signal undocumented integration points worth investigating further.

### Step 3 — CANDIDATE Tags Pending Review

```sql
SELECT id, target_ref, kind,
       json_extract(value,'$.subkind') as subkind,
       confidence, source_tool
FROM tags
WHERE session_id = '<SESSION>'
  AND target_repo = '<REPO>'
  AND status = 'CANDIDATE'
ORDER BY confidence DESC
```

Work from the top down (highest confidence first). High-confidence CANDIDATE tags from a reliable source_tool are usually correct; low-confidence tags from semantic tools (ColGREP, osgrep) need closer inspection.

### Step 4 — Read Source Evidence Before Promoting or Rejecting

After identifying a CANDIDATE to review, read its evidence:

```sql
SELECT id, target_ref, source_evidence,
       json_extract(value,'$.line') as line_number,
       json_extract(value,'$.subkind') as subkind,
       confidence, source_tool
FROM tags
WHERE id = '<id from step 3>'
```

Decision logic:
- `source_evidence` matches what you see in the file at `line_number` → `promote`
- `source_evidence` describes something that no longer exists (refactored away) → `reject`
- `source_evidence` is ambiguous or you can't tell without more context → leave as CANDIDATE

## Batch Review (Multiple Candidates from Same Source Tool)

When multiple CANDIDATE tags from the same `source_tool` are all wrong:

```sql
-- First: confirm they're all wrong by sampling a few
SELECT id, target_ref, source_evidence, confidence
FROM tags
WHERE session_id = '<SESSION>'
  AND source_tool = '<tool>'
  AND status = 'CANDIDATE'
ORDER BY confidence DESC
LIMIT 10
```

If the pattern is consistently wrong, batch-reject by running: `bun tools/tag-store.ts reject --db <db_path> --tag-id <tag_id>` for each one. Do not promote any from a batch where the majority are wrong — the source_tool's output is unreliable for this repo.

## When to Re-Scan vs Trust Existing PROMOTED Tags

- **Re-scan**: the repo has had active commits since the last scan AND the changed areas overlap with the scanned patterns
- **Trust existing**: the PROMOTED tags cover stable infrastructure code (database clients, framework setup) that changes rarely; spot-check 2-3 tags to verify they still match
- **Never trust blindly**: a PROMOTED tag can become stale if the code was refactored. STALE status is set by the orchestrator during a re-scan, not retroactively. Check `started_at` in `meta.json` against the repo's recent commit history.

## Export Warning

`export` includes CANDIDATE, VALIDATED, and PROMOTED tags — CANDIDATE tags are **unreviewed findings**. When delivering an export to downstream consumers or clients:
- Filter to VALIDATED and PROMOTED only unless the consumer explicitly wants candidates: `WHERE status IN ('VALIDATED','PROMOTED')`
- Never represent an export as "confirmed findings" without filtering out CANDIDATE tags first
