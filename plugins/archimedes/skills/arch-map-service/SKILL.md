---
name: arch-map-service
description: Full Archimedes two-tier pipeline for a single service. Runs arch-structure (Tier 1 ast-grep) then arch-search (Tier 2 chunkhound) in the same session, then synthesizes findings into a unified architecture map. Use when you need a complete picture of a service's patterns, dependencies, capabilities, and technical debt. Keywords: map service, architecture analysis, full scan, structure plus semantic, service map, Archimedes pipeline, complete analysis, two-tier, arch-structure, arch-search, session, VALIDATED, CANDIDATE, combined scan, ast-grep, chunkhound, HUMAN weight, MACHINE weight, DEBT tags, PATTERN tags, DEPENDENCY tags, first-time scan, unified map, cross-tier correlation, session_id, promote candidates, text-embedding-3-small, OPENAI_API_KEY.
---
# arch-map-service

Run the complete two-tier Archimedes pipeline against a single service and synthesize a unified architecture map.

**Two-tier pipeline:**
- Tier 1 (`arch-structure`, ast-grep): writes PATTERN + DEPENDENCY + DEBT tags with `HUMAN` weight, `VALIDATED` status — deterministic, zero hallucination
- Tier 2 (`arch-search`, chunkhound): writes PATTERN + DEPENDENCY CANDIDATE tags with `MACHINE` weight, `CANDIDATE` status — probabilistic, requires human promotion

Both tiers run in the **same session**. Cross-tier correlation is only possible with a shared `session_id`.

## Before Invoking arch-map-service

**Ask yourself:**
- Is this a full first-time scan, or just adding semantic coverage to an existing structure scan? (If adding coverage only → invoke `arch-search` directly, not this skill)
- Is the service root known and accessible as an absolute path? (Required — monorepo roots and subdirectories produce contaminated results)
- Is `OPENAI_API_KEY` available? (Required for Tier 2 chunkhound indexing — Tier 2 will fail silently without it)
- Do you need results right now, or can you wait for the chunkhound index to build? (First-time index on a large repo takes 5–30 minutes)
- Is this a second service in the same conversation? (Never reuse an existing session — create a new `session_id` for each service)

## Usage

Run in order. Never swap tiers. Never use separate sessions.

```bash
# 1. Initialize session
DB_PATH=$(bun tools/session-init.ts --session $SESSION --repo $REPO --packs "core,aws-serverless" \
  | jq -r .db_path)

# 2. Tier 1: structural scan (MANDATORY FIRST)
bash tools/scripts/run-structure-scan.sh $REPO $SESSION $DB_PATH "core,aws-serverless"

# 3. Tier 2: semantic scan (appends to same session)
bash tools/run-semantic-scan.sh $REPO $SESSION $DB_PATH "core,aws-serverless"
```

## Which Packs

Use identical packs for both tiers. Pattern packs and query packs are parallel:

| Pattern pack | Query pack | Coverage |
|---|---|---|
| `core` | `core` | General TypeScript patterns |
| `aws-serverless` | `aws-serverless` | Lambda + AWS services |
| `iot-core` | `iot-core` | IoT / MQTT / Greengrass |
| _(N/A in patterns)_ | `delos-platform` | Delos NVA ecosystem |

**MANDATORY: READ ENTIRE FILE `plugins/archimedes/skills/arch-structure/SKILL.md`** before choosing packs for an unfamiliar repository. The pack selection decision tree in that file applies to both tiers. Apply it once and use the same pack list for both tiers.

**Do NOT load `plugins/archimedes/skills/arch-structure/SKILL.md`** if packs are already specified in the session's `meta.json`.

Note: `delos-platform` is a semantic-only pack — there is no corresponding structural pattern pack. Include it for any Delos NVA service alongside `core`.

**When the service has both AWS patterns AND NVA/Delos patterns:** Use `core,aws-serverless,delos-platform` for Tier 2 and `core,aws-serverless` for Tier 1 (delos-platform has no Tier 1 equivalent). This asymmetry is expected — the pack table above shows which packs apply per tier.

## Pre-flight Checks

Run before starting either tier:

```bash
# 1. Confirm OPENAI_API_KEY is available (Tier 2 requirement)
[[ -n "$OPENAI_API_KEY" ]] && echo "key set" || echo "MISSING — Tier 2 will fail"

# 2. Confirm repo path is a service root, not a monorepo root or subdirectory
ls $REPO/package.json || ls $REPO/tsconfig.json  # should exist at service root

# 3. If re-running: confirm session does not already exist for a different repo
cat $REPO/.archimedes/sessions/$SESSION/meta.json 2>/dev/null | jq '{session_id, repo}' 2>/dev/null
```

## Post-Map Analysis

After both tiers complete, run these three queries to produce the architecture map:

**MANDATORY before writing any SQL beyond the three queries below: READ ENTIRE FILE `cookbook/tag-store/queries.md`** (22 ready-to-use templates).

**Do NOT load `cookbook/tag-store/queries.md`** for the three standard map queries below — they are already provided in full here.

**1. Full tag inventory (combined tiers):**
```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT kind, weight_class, status, COUNT(*) as count FROM tags WHERE target_repo='$REPO' AND session_id='$SESSION' GROUP BY kind, weight_class, status ORDER BY count DESC"
```

What to look for:
- 0 PATTERN or DEPENDENCY tags after Tier 1 = scan completeness problem (run Tier 1 diagnostics before Tier 2)
- 0 CANDIDATE tags after Tier 2 = index build failure or missing API key (run Tier 2 diagnostics below)
- DEBT > 20% of PATTERN count = systemic debt requiring remediation sprint

**2. Semantic-only discoveries (files with MACHINE CANDIDATE tags but no VALIDATED tags):**
```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT DISTINCT t1.target_ref, json_extract(t1.value,'$.subkind') as subkind FROM tags t1 WHERE t1.session_id='$SESSION' AND t1.weight_class='MACHINE' AND t1.status='CANDIDATE' AND NOT EXISTS (SELECT 1 FROM tags t2 WHERE t2.session_id='$SESSION' AND t2.target_ref=t1.target_ref AND t2.weight_class='HUMAN') ORDER BY subkind"
```

These files have semantic patterns but no structural tags — they are undocumented integration points or dynamically-dispatched code that ast-grep missed.

**3. Debt summary:**
```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT target_ref, json_extract(value,'$.subkind') as issue, confidence FROM tags WHERE target_repo='$REPO' AND session_id='$SESSION' AND kind='DEBT' AND status NOT IN ('REJECTED') ORDER BY confidence DESC"
```

## What Good Output Looks Like

On a typical mid-size service (10–30 source files, AWS Lambda + DynamoDB):

| Metric | Expected range |
|---|---|
| Tier 1 VALIDATED PATTERN tags | 15–60 |
| Tier 1 VALIDATED DEPENDENCY tags | 5–20 |
| Tier 1 VALIDATED DEBT tags | 0–10 |
| Tier 2 MACHINE CANDIDATE tags | 20–80 |
| Semantic-only files (Query 2) | 2–10 |

A combined PATTERN + CANDIDATE count under 10 on a non-trivial service is a strong signal of a scan completeness problem, not "no patterns found."

## Interpreting the Combined Map

| Finding | What It Means |
|---|---|
| VALIDATED PATTERN + CANDIDATE on same file | High confidence — both tiers agree this is a key component |
| CANDIDATE with no VALIDATED on same file | Semantic-only discovery — verify in source before treating as architectural fact |
| DEBT + PATTERN in same file | Highest refactoring risk — working code with known technical debt |
| MACHINE CANDIDATE but 0 VALIDATED in entire service | Likely ast-grep pack gap — review `patterns/_registry.yaml` |
| DEBT > 20% of PATTERN count | Systemic debt, not isolated issues — flag for remediation sprint |

## Troubleshooting

| Symptom | Tier | Cause | Fix |
|---|---|---|---|
| 0 PATTERN/DEPENDENCY tags after Tier 1 | 1 | Wrong path, wrong language, or misspelled pack | Follow Tier 1 diagnostics below; do NOT proceed to Tier 2 |
| 0 CANDIDATE tags after Tier 2 | 2 | Index not built or `OPENAI_API_KEY` missing | Follow Tier 2 diagnostics below |
| `ast-grep: command not found` | 1 | CLI not installed | `npm i -g @ast-grep/cli` |
| `chunkhound: command not found` | 2 | Not in PATH | `export PATH="$HOME/.local/bin:$PATH"` |
| `meta.json` not found after session-init | Both | Session init failed — `$REPO` path may not exist | Verify `$REPO` is absolute and accessible; confirm `$SESSION` doesn't conflict with existing session |
| CANDIDATE count low but index exists | 2 | Query packs don't match service domain | Re-run with packs from decision tree; reject current batch |
| Session already has a different `repo` field | Both | Session reuse for a second service | Create a new `$SESSION` value; never reuse across services |

**If Tier 1 produces 0 tags — ordered diagnostic:**

1. `ast-grep --version` — if not found: `npm i -g @ast-grep/cli`
2. Confirm `$REPO` is the service root (absolute path, not subdirectory): `ls $REPO/package.json`
3. Test language match: `ast-grep --lang typescript <one-file>` — no output means wrong language
4. Confirm pack names against `patterns/_registry.yaml` — misspelled packs are silently skipped
5. Do NOT proceed to Tier 2 until Tier 1 produces tags — running Tier 2 against an empty VALIDATED set makes cross-tier correlation (Query 2) meaningless

**If Tier 2 produces 0 CANDIDATE tags — ordered diagnostic:**

1. Verify index file exists: `ls $REPO/.archimedes/index/chunkhound.db`
2. Confirm API key is set: `[[ -n "$OPENAI_API_KEY" ]] && echo "set" || echo "missing"`
3. Test directly: `python3 tools/chunkhound-search.py --query "MongoDB client" --repo $REPO --db $REPO/.archimedes/index/chunkhound.db --top-k 3`
4. If index is absent, rebuild: `chunkhound index $REPO --db $REPO/.archimedes/index/chunkhound.db --model text-embedding-3-small --api-key $OPENAI_API_KEY`
5. Zero CANDIDATE tags is never "no semantic patterns found" until these checks pass

## Guardrails

- **Never run arch-search before arch-structure** — Query 2's cross-tier correlation requires VALIDATED tags to exist first. Running semantic first means the "semantic-only discoveries" query returns every CANDIDATE file (nothing to compare against), making it useless as a gap detector.
- **Never use separate sessions for Tier 1 and Tier 2** — shared `session_id` is required for the semantic-only discovery query. Separate sessions make the `NOT EXISTS` cross-tier join impossible; the two tag sets have no shared key.
- **Never treat CANDIDATE as confirmed architectural fact** — semantic similarity surfaces plausible but contextually incorrect matches. Use the promotion workflow (`bun tools/tag-store.ts promote`) before including MACHINE findings in deliverables.
- **Never scan a monorepo root** — same constraint as arch-structure: scan service roots individually. Mixed-service sessions produce unfilterable findings from multiple repos and contaminate the `target_repo` index.
- **Never skip the full tag inventory query (Query 1)** — it is the only reliable way to detect coverage gaps across both tiers simultaneously. A gap (e.g., 0 DEPENDENCY tags after both tiers) suggests a pack selection mismatch that would otherwise go undetected.
- **Never reuse a session for a second service** — session IDs are bound to repos at init time. Running arch-map-service on a second repo with the same session contaminates findings from both services and makes all `target_repo`-scoped queries unreliable.
- **Never parallelize Tier 1 and Tier 2** — the structure scan and semantic scan must run sequentially within the same session. Concurrent writes to the same `tags.db` produce undefined behavior due to write contention on the SQLite file.
- **Never proceed to Tier 2 when Tier 1 produces 0 tags** — an empty VALIDATED set means either the scan failed or packs don't match the language. Proceeding produces CANDIDATE tags with no VALIDATED counterparts, making all cross-tier analysis meaningless.
- **Never include MACHINE CANDIDATE findings in stakeholder deliverables without explicit disclosure of their probabilistic status** — confidence scores are cosine similarity values, not architectural certainty. Presenting CANDIDATE tags as confirmed facts in a design document or architecture review erodes trust in the entire map when a promoted candidate turns out to be a false positive. Always label MACHINE findings as "pending human verification" or promote them first.
