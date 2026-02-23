---
name: arch-search
description: Semantic code search using chunkhound vector embeddings. Runs query packs against a repository and writes PATTERN and DEPENDENCY CANDIDATE tags (weight_class MACHINE, status CANDIDATE) to the tag store — no LLM in the write path. Use when: finding code patterns ast-grep can't match (business logic, domain concepts, NVA commands, score calculators, multi-db routing), discovering undocumented integration points, adding semantic coverage after arch-structure for the same session, or when arch-structure produced 0 DEPENDENCY/PATTERN tags despite visible external dependencies. Keywords: semantic search, vector search, chunkhound, CANDIDATE tags, capability discovery, business logic, NVA patterns, MongoDB client, score calculator, delos, darwin, aws-serverless, iot-core, embedding similarity, text-embedding-3-small, OPENAI_API_KEY, run-semantic-scan.
---
# arch-search

Run semantic query packs against a repository. CANDIDATE tags are written by scripts, not agents — the search is chunkhound embedding similarity, not LLM inference.

**Core principle:** The write path is entirely script-driven. Agents analyze what scripts found. Agents never call chunkhound directly or write MACHINE tags manually. CANDIDATE tags are probabilistic — always use the promotion workflow before treating findings as architectural fact.

## Before Invoking arch-search

**Ask yourself:**
- Did arch-structure leave a dependency coverage gap? (0 DEPENDENCY tags on a service with obvious external calls = yes)
- Are the undiscovered patterns semantic — business logic, domain workflows, NVA chains, score calculators — rather than syntactic?
- Is the repo's language/framework covered by any pack? (Pure Go or Rust services have no pack coverage — semantic scan will produce 0 meaningful findings)
- Has arch-structure already run for this session and repo? (Required — see Guardrails)

## Usage

```bash
bash tools/run-semantic-scan.sh \
  <repo_path> \
  <session_id> \
  <db_path> \
  "<comma-separated-packs>"
```

Arguments are positional and order-sensitive, identical to `tools/scripts/run-structure-scan.sh`. `repo_path` must be absolute, pointing to the **service root** (not a subdirectory, not a monorepo root).

## Which Packs to Use

Select packs based on what arch-structure's PATTERN and DEPENDENCY tags revealed about the technology stack. When no prior structure scan exists, start with `core` and expand.

**Decision tree (apply in order — first match wins):**

1. NVA commands, CoreChannel/PluginChannel, Darwin Capabilities, Watcher triggers → add `delos-platform`
2. AWS Lambda handlers, DynamoDB multi-db routing, Kinesis/Firehose, Athena CTEs, Redshift COPY, Secrets Manager → add `aws-serverless`
3. LwM2M decoders, OTBR, Greengrass, device snapshots, cellular management → add `iot-core`
4. Any TypeScript/Node.js service → always include `core`

**Common stack combinations:**
- Pure TypeScript/Node.js service → `core`
- AWS Lambda + DynamoDB → `core,aws-serverless`
- Delos Darwin/NVA service → `core,aws-serverless,delos-platform`
- IoT/Edge service → `core,iot-core`
- Full Delos stack → `core,aws-serverless,delos-platform,iot-core`

When uncertain: start with `core`. Add packs only after reviewing what arch-structure's PATTERN tags reveal about the stack. Do not run all four packs on every repo — unused packs inflate CANDIDATE counts with false positives.

## Pre-flight: $SESSION, $REPO, $DB_PATH

Semantic scan **appends to the same session** as the structure scan — do NOT initialize a new session. The three variables must match what was used for arch-structure.

Resolve `$DB_PATH` from the existing session's `meta.json`:

```bash
DB_PATH=$(cat $REPO/.archimedes/sessions/$SESSION/meta.json | jq -r .db_path)
```

Verify the session exists before running the scan:

```bash
# Confirm session was initialized
cat $REPO/.archimedes/sessions/$SESSION/meta.json | jq '{session_id, repo, db_path}'
```

If `meta.json` does not exist, the session was not initialized — run `bun tools/session-init.ts --session $SESSION --repo $REPO` before proceeding.

## Index Lifecycle

The chunkhound index persists at `$REPO/.archimedes/index/chunkhound.db` (DuckDB format). `run-semantic-scan.sh` builds it automatically on first run and rebuilds if missing or older than 7 days. Building requires `OPENAI_API_KEY` (for `text-embedding-3-small`). Do not rebuild manually — the orchestrator manages this.

**Verify the API key is available before running the scan:**

```bash
# Confirm key is set (don't print the value)
[[ -n "$OPENAI_API_KEY" ]] && echo "key set" || echo "MISSING — scan will fail"
```

## Post-Scan Analysis

**MANDATORY before writing any SQL beyond the scope-check queries below: READ ENTIRE FILE `cookbook/tag-store/queries.md`** (22 ready-to-use templates).
**Do NOT load** for the three standard scope-check queries above — they are already provided in full here.
**Do NOT load** `cookbook/chunkhound/cli.md` — that reference is for query pack rule authors, not scan runners.

**Step 1 — Scope check (CANDIDATE tags):**

```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT kind, COUNT(*) as count FROM tags WHERE target_repo='$REPO' AND session_id='$SESSION' AND weight_class='MACHINE' AND status='CANDIDATE' GROUP BY kind"
```

What to look for: CANDIDATE count < 5 on a non-trivial service = likely index build failure or missing API key. Zero CANDIDATE tags is never "no semantic patterns found" until you've run the Confirming Scan Completeness checks.

**Step 2 — New patterns not found by ast-grep:**

```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT DISTINCT json_extract(value,'$.subkind') as subkind, target_ref FROM tags WHERE target_repo='$REPO' AND session_id='$SESSION' AND weight_class='MACHINE' AND status='CANDIDATE' ORDER BY subkind"
```

What to look for: Subkinds absent from VALIDATED PATTERN tags — semantic-only discoveries are the highest-value findings from this tier.

**Step 3 — Promote or reject candidates:**

```bash
# Promote a validated finding (after reading source_evidence)
bun tools/tag-store.ts promote --db $DB_PATH --tag-id <uuid>

# Reject a false positive
bun tools/tag-store.ts reject --db $DB_PATH --tag-id <uuid>
```

**Promotion rule:** Do not promote any CANDIDATE tag without first reading `source_evidence` and confirming the matched code exists in the current source file at the recorded location. If `source_evidence` describes code that no longer exists (refactored away), reject rather than promote.

**Confidence thresholds:**
- >= 0.80 similarity — promote if `source_evidence` matches; high signal
- 0.50–0.79 — verify `source_evidence` carefully before promoting; moderate signal
- < 0.50 — reject unless independently confirmed in the source file; low signal

## Confirming Scan Completeness

Run before beginning post-scan analysis when Step 1 shows fewer than 5 CANDIDATE tags:

```bash
# 1. Verify index was built
ls $REPO/.archimedes/index/chunkhound.db

# 2. Count all MACHINE-weight tags for this session
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT COUNT(*) as total FROM tags WHERE session_id='$SESSION' AND weight_class='MACHINE'"
```

If total is 0, diagnose in this order:

1. `chunkhound --version` — if not found: `export PATH="$HOME/.local/bin:$PATH"`
2. Confirm `OPENAI_API_KEY` is set (required for embedding — see Pre-flight above)
3. Test directly: `python3 tools/chunkhound-search.py --query "MongoDB client" --repo $REPO --db $REPO/.archimedes/index/chunkhound.db --top-k 3`
4. Check if index was built: if `ls $REPO/.archimedes/index/chunkhound.db` fails, rebuild: `chunkhound index $REPO --db $REPO/.archimedes/index/chunkhound.db --model text-embedding-3-small --api-key $OPENAI_API_KEY`

## Query Packs

| Pack | Coverage |
|---|---|
| core | Sequelize models, LIVR validation, chista services, Poller background tasks, Express routes, Repository/Service classes |
| aws-serverless | MongoDB multi-db clients (events-db, historical-db, snapshots-meta), Athena CTE builders, Redshift COPY loaders, Kinesis Firehose transforms, score calculators (DAQI/ITC/IVC/comfort/IEQ), multi-tier storage routers, Secrets Manager injection |
| delos-platform | NVA executor patterns (executeNVA, executeAndShiftNVA, executeNVAInBatches), CoreChannel/PluginChannel clients, Darwin Capability definitions, DevicesNVARepo, Watcher triggers, NVA parse+match pipeline |
| iot-core | LwM2M event decoders, OTBR integration, Greengrass component patterns, device snapshot pipelines, cellular connection management |

Available packs are listed in `queries/_registry.yaml`. Do not pass a pack name not listed there — unknown packs are silently skipped.

## Guardrails

- **Never invoke `chunkhound` directly as a scanner** — always use `run-semantic-scan.sh`. Direct invocation bypasses session tracking, tag deduplication, and `source_evidence` normalization. Read-only diagnostics (`chunkhound --version`) are not restricted.
- **Never write MACHINE tags manually** — manually written MACHINE tags lack `source_query` and `source_evidence` metadata required by the promotion workflow. The tag store will accept the write but the resulting tag cannot be reliably promoted.
- **Never promote CANDIDATE tags without reading `source_evidence`** — semantic similarity surfaces plausible but contextually incorrect matches. Always verify the snippet exists in the current source file at the recorded line before promoting.
- **Never treat 0 CANDIDATE tags as "no semantic patterns"** — it means the index was not built or `OPENAI_API_KEY` was missing. Run the ordered Confirming Scan Completeness checks before concluding nothing was found.
- **Never scan a subdirectory** — `target_ref` paths are recorded relative to scan root. Subdirectory scans produce truncated cross-references that break correlation with arch-structure tags.
- **Never run arch-search before arch-structure on the same session** — Step 2's "subkinds absent from VALIDATED PATTERN tags" comparison requires arch-structure's VALIDATED tags to exist first. Running semantic first makes the cross-tier comparison meaningless.
- **Never run semantic scan in a different session than the structure scan** — cross-tier correlation queries require shared `session_id`. A new session ID severs the link between VALIDATED PATTERN tags and CANDIDATE semantic findings.
- **Never run all four packs on every repository** — unused packs produce false-positive CANDIDATE tags from unrelated patterns. Select packs based on stack evidence from arch-structure, not preemptively.
- **Never reuse a session ID for a different repository** — session IDs are bound to repos at init time. Scanning a second repo into an existing session contaminates findings from both repos.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `chunkhound: command not found` | Not in PATH | `export PATH="$HOME/.local/bin:$PATH"` |
| 0 CANDIDATE tags | Index not built or `OPENAI_API_KEY` missing | Verify `ls $REPO/.archimedes/index/chunkhound.db`; rebuild if absent |
| CANDIDATE count unexpectedly low | Query too specific or `top_k` too small | Increase `top_k` in rule YAML; broaden query text |
| Same file tagged 10+ times | Multiple overlapping rules match the same file | Normal for hub files (e.g., `db-client.ts`); review top hits manually |
| Index rebuilds on every run | `mtime` check condition failing | Run `find $REPO/.archimedes/index/ -name "chunkhound.db" -mtime +7` manually to verify |
| `OPENAI_API_KEY` error during index | Embedding API key not set | `export OPENAI_API_KEY=<key>` before running |
| Pack silently skipped | Pack name misspelled or not in `_registry.yaml` | Check `queries/_registry.yaml`; correct the pack name |
| CANDIDATE tags present but all incorrect | Packs don't match service domain | Re-run with packs selected from the decision tree; reject current batch |
