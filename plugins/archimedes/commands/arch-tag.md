---
model: opus
description: Tag store operations — query, promote, export, and manage the Archimedes architectural knowledge store. USE WHEN inspecting what has been discovered, promoting machine findings for human review, querying tags by kind or repo, or exporting the knowledge base for client delivery.
argument-hint: <query|promote|export|stale> [--session <id>] [--format <sqlite|json>] [--kind <kind>] [--repo <path>]
---

# Arch Tag

Entry point for all Archimedes tag store operations.

## Variables

```
OPERATION:   from $ARGUMENTS — query|promote|export|stale|stats. Required.
SESSION:     from $ARGUMENTS — --session <id>. Required for most operations.
FORMAT:      from $ARGUMENTS — --format sqlite|json. Default: sqlite for export.
KIND:        from $ARGUMENTS — --kind PATTERN|DEPENDENCY|ROLE|DEBT|FLOW|BOUNDARY|CAPABILITY|RISK. Optional filter.
REPO:        from $ARGUMENTS — --repo <path>. Optional filter.
REVIEW_ALL:  from $ARGUMENTS — --review-all flag for promote. Reviews all CANDIDATE tags.
TAG_ID:      from $ARGUMENTS — --id <uuid>. Required for single promote/reject.
VALIDATED_BY: from $ARGUMENTS — --validated-by <name>. Default: "human".
```

## Load Skill

First, read the skill documentation:

```
skills/arch-tags/SKILL.md
```

For schema reference: `cookbook/tag-store/schema.md`
For query patterns: `cookbook/tag-store/queries.md`

## Operations

### query

Show tags from the store:

```bash
# Basic: show all non-rejected tags for a session
bun tools/tag-store.ts query "SELECT id, target_ref, kind, confidence, status, source_tool FROM tags WHERE status != 'REJECTED' ORDER BY confidence DESC LIMIT 50" --session ${SESSION}

# Filter by kind
bun tools/tag-store.ts query "SELECT id, target_ref, target_repo, confidence, status FROM tags WHERE kind = '${KIND}' ORDER BY confidence DESC" --session ${SESSION}

# Filter by repo
bun tools/tag-store.ts query "SELECT id, target_ref, kind, confidence, status FROM tags WHERE target_repo LIKE '%${REPO}%'" --session ${SESSION}
```

Format results as a readable table. Show: target_ref, kind, confidence, status, source_tool.

### stats

Session statistics:

```bash
bun tools/tag-store.ts query "SELECT kind, status, COUNT(*) as count, AVG(confidence) as avg_conf FROM tags GROUP BY kind, status ORDER BY kind, count DESC" --session ${SESSION}
```

Show as a summary table with total counts by kind and status.

### promote

Review and promote CANDIDATE tags to PROMOTED status.

**Single tag promotion:**
```bash
bun tools/tag-store.ts promote --id ${TAG_ID} --validated-by "${VALIDATED_BY}" --session ${SESSION}
```

**Review all CANDIDATE tags:**
1. Query: `bun tools/tag-store.ts query "SELECT id, target_ref, kind, confidence, source_evidence FROM tags WHERE status='CANDIDATE' ORDER BY confidence DESC" --session ${SESSION}`
2. Present each finding to the user grouped by kind
3. For each: ask "Promote, Reject, or Skip?" using AskUserQuestion
4. Apply decisions: promote or reject each tag accordingly

### export

Export the tag store:

```bash
bun tools/tag-store.ts export --session ${SESSION} --format ${FORMAT}
```

Report the output file path.

### stale

Show tags that may be stale (written in a previous session):

```bash
bun tools/tag-store.ts query "SELECT id, target_ref, kind, source_tool, updated_at FROM tags WHERE session_id != '${SESSION}' AND status NOT IN ('REJECTED', 'STALE') ORDER BY updated_at ASC" --session ${SESSION}
```

## Output Format

For each operation, output:
1. Operation name and session ID
2. Results table
3. Summary statistics (count of tags shown/modified)
4. Next action suggestion (e.g., "Run `/arch-tag promote` to review 12 CANDIDATE findings")
