---
name: arch-assess-debt
description: "Comprehensive technical debt assessment combining deterministic anti-pattern detection, coupling analysis via call-chain tracing, and documentation mining. Chains arch-structure (PATTERN anti-pattern tags) → arch-observe (coupling hotspots via osgrep trace fan-out) → arch-docs (debt mentioned in ADRs, design docs, and decision records). USE WHEN: auditing a service for migration readiness, identifying modernization candidates, prioritizing refactoring sprints, or producing an architectural health report. Writes DEBT and RISK tags. Keywords: debt assessment, migration readiness, anti-pattern, modernization, coupling hotspot, architectural health, tech debt audit, remediation list."
---
# arch-assess-debt

Produce a ranked debt and risk inventory for a service by combining three evidence sources: deterministic anti-pattern tags (arch-structure), coupling hotspot analysis (arch-observe via osgrep trace), and documentation-surfaced debt (arch-docs via qmd).

**Core principle:** Debt requires a specific technical problem, not just age. Every DEBT or RISK tag must cite the tool output, line reference, or document excerpt that proved the problem exists. "Old code" with no measurable failure mode is not debt — it is legacy code. The distinction matters for prioritization.

**Thinking framework:** For each PATTERN anti-pattern tag found, ask: *What is its blast radius? What would break during migration if this is not fixed first?* A `dynamodb-scan-antipattern` on a high-traffic ingestion path has a larger blast radius than the same tag on a batch cleanup job. Severity is the product of the problem's magnitude and its migration impact.

## Supporting Documentation

| Need | Load | When |
|------|------|------|
| osgrep CLI flags and command reference | `../../cookbook/osgrep/cli.md` | MANDATORY if `osgrep trace` returns unexpected output or flags are unclear in Phase 2 |
| qmd CLI flags and collection workflow | `../../cookbook/qmd/cli.md` | MANDATORY if `qmd collection add` or `qmd query` fails in Phase 3 |
| Tag schema and confidence gradient | `../../cookbook/tag-store/schema.md` | MANDATORY when setting confidence values in Phases 1-3 if uncertain about the gradient |
| Ready-to-use SQL query templates | `../../cookbook/tag-store/queries.md` | MANDATORY if any tag-store SQL query in this skill returns errors |

Load only the reference triggered by the specific failure. Do not preload all four.

---

## Pre-flight: Confirm PATTERN Tags Exist

arch-assess-debt requires PATTERN tags written by arch-structure. Without them, debt assessment has no deterministic foundation and findings will be incomplete.

```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT COUNT(*) as pattern_count FROM tags WHERE session_id='$SESSION' AND kind='PATTERN' AND status NOT IN ('REJECTED')"
```

**Decision:**
- `pattern_count >= 1` → proceed to Phase 1
- `pattern_count = 0` → **stop.** Run arch-structure first, then return to this skill.

If arch-structure was run under a different session, do not proceed with a mismatched session. Re-run arch-structure in the current session or load the correct `$DB_PATH` and `$SESSION` from `$REPO/.archimedes/sessions/<session>/meta.json`.

---

## Phase 1: Anti-Pattern Mining (PATTERN Tags → DEBT Candidates)

Query the tag store for PATTERN tags whose subkind signals a known anti-pattern. These are the highest-confidence debt signals because they were written by deterministic script execution — zero hallucination.

### 1a. Retrieve All Anti-Pattern PATTERN Tags

```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT target_ref, json_extract(value,'$.subkind') as subkind, json_extract(value,'$.note') as note, confidence, line_start FROM tags WHERE session_id='$SESSION' AND kind='PATTERN' AND status NOT IN ('REJECTED') AND json_extract(value,'$.subkind') IN ('dynamodb-scan-antipattern','lambda-cold-start-risk','secret-hardcoded-ts','secret-hardcoded-py','mqtt-wildcard-antipattern','ggv2-v1-sdk-antipattern','sqs-no-dlq-antipattern','missing-error-handling','missing-idempotency') ORDER BY confidence DESC"
```

Anti-pattern subkinds and their migration blast radius:

| Subkind | Migration Blast Radius | Why |
|---------|----------------------|-----|
| `dynamodb-scan-antipattern` | HIGH | Full-table scans block during traffic spikes; must be resolved before any throughput-scaling migration |
| `secret-hardcoded-ts` / `secret-hardcoded-py` | CRITICAL | Credentials rotate on migration; hardcoded values break immediately |
| `lambda-cold-start-risk` | MEDIUM | Latency regressions surface in migration load testing; fix before go-live |
| `mqtt-wildcard-antipattern` | HIGH | Wildcard subscriptions amplify message volume; topic re-design required before broker migration |
| `ggv2-v1-sdk-antipattern` | HIGH | v1 SDK is incompatible with GGv2 IPC; must be replaced before Greengrass migration |
| `sqs-no-dlq-antipattern` | MEDIUM | Silent message loss during migration queue drains; add DLQ before cut-over |
| `missing-idempotency` | HIGH | Duplicate delivery during cut-over causes data corruption; idempotency is a migration prerequisite |

### 1b. Write DEBT Tags for Confirmed Anti-Patterns

For each row returned in 1a, write a DEBT tag. Copy `target_ref`, `subkind`, and `note` from the PATTERN tag row:

```bash
bun tools/tag-store.ts write --tag '{
  "target_type": "FILE",
  "target_ref": "<target_ref from query>",
  "target_repo": "'"$REPO"'",
  "kind": "DEBT",
  "value": "{\"subkind\": \"<subkind>\", \"pattern_name\": \"<subkind>\", \"source_phase\": \"arch-structure\", \"blast_radius\": \"HIGH\", \"migration_impact\": \"<describe what breaks if not fixed before migration>\", \"note\": \"<note from PATTERN tag>\"}",
  "confidence": 0.90,
  "weight_class": "HUMAN",
  "source_tool": "ast-grep",
  "source_query": "pattern-pack scan",
  "source_evidence": "PATTERN tag written by run-structure-scan.sh; subkind=<subkind>; line <line_start>",
  "status": "VALIDATED",
  "session_id": "'"$SESSION"'"
}' --session $SESSION
```

**Confidence for Phase 1 DEBT tags:** `0.90` (HUMAN/VALIDATED) — inherited from the deterministic pattern scan.

### 1c. Retrieve DEBT Tags Written by arch-structure Directly

Some pattern packs write DEBT tags directly (kind=DEBT, not kind=PATTERN). Include these in the inventory:

```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT target_ref, json_extract(value,'$.subkind') as subkind, json_extract(value,'$.note') as note, confidence FROM tags WHERE session_id='$SESSION' AND kind='DEBT' AND weight_class='HUMAN' AND status NOT IN ('REJECTED') ORDER BY confidence DESC"
```

These are already DEBT-tagged — no conversion needed. Include them in Phase 4 synthesis.

---

## Phase 2: Coupling Analysis (osgrep trace → Coupling Hotspot DEBT)

osgrep trace reveals which components are structurally coupled to many others -- a class of debt invisible to PATTERN tags because coupling emerges across files, not within one.

### 2a. Identify Key Files from Phase 1

From Phase 1 output, collect the `target_ref` values for files with anti-pattern tags. These are your highest-priority trace candidates. Also collect any files with a high PATTERN density (many tags in the same file):

```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT target_ref, COUNT(*) as tag_count FROM tags WHERE session_id='$SESSION' AND kind='PATTERN' AND status NOT IN ('REJECTED') GROUP BY target_ref HAVING tag_count >= 3 ORDER BY tag_count DESC LIMIT 20"
```

Files with 3+ PATTERN tags in a single file are likely god-files or high-complexity entry points. Combine with Phase 1 anti-pattern files for the trace candidate list.

### 2b. Trace Outgoing Call Count Per Candidate

For each candidate file, extract the primary exported symbol and run osgrep trace:

```bash
# First: confirm osgrep index is built
osgrep list

# Get exported symbols from a candidate file
osgrep symbols --path "${REPO}/src/handlers/deviceDataHandler.ts"

# Trace the primary symbol
osgrep trace "DeviceDataHandler.handleMessage"
# Or by file path:
osgrep trace "src/handlers/deviceDataHandler.ts:handleMessage"
```

**Count outgoing calls in trace output:** each line naming a symbol in the codebase (not standard library) = 1 outgoing call. Record as `outgoing_count`.

**Coupling hotspot threshold:** `outgoing_count >= 10` → write a DEBT tag with `subkind: coupling-hotspot`.

If osgrep is not indexed for this repo, run:
```bash
osgrep index --path "${REPO}"
```

### 2c. Write DEBT Tags for Coupling Hotspots

```bash
bun tools/tag-store.ts write --tag '{
  "target_type": "FILE",
  "target_ref": "src/handlers/deviceDataHandler.ts",
  "target_repo": "'"$REPO"'",
  "kind": "DEBT",
  "value": "{\"subkind\": \"coupling-hotspot\", \"pattern_name\": \"high-fan-out\", \"outgoing_calls\": 12, \"threshold\": 10, \"blast_radius\": \"HIGH\", \"migration_impact\": \"Changing this component requires coordinating changes in 12 downstream dependents — high coordination cost during migration.\", \"note\": \"12 outgoing service dependencies exceed the coupling threshold of 10. Extract sub-workflows into dedicated coordinator classes.\"}",
  "confidence": 0.70,
  "weight_class": "MACHINE",
  "source_tool": "osgrep",
  "source_query": "trace DeviceDataHandler.handleMessage",
  "source_evidence": "osgrep trace counted 12 distinct callee symbols in codebase (excluding stdlib)",
  "status": "CANDIDATE",
  "session_id": "'"$SESSION"'"
}' --session $SESSION
```

**Confidence for Phase 2 DEBT tags:** `0.70` (MACHINE/CANDIDATE) — osgrep trace is probabilistic; counts may differ from actual runtime call paths.

### 2d. Write RISK Tags for Files with BOTH Anti-Patterns AND Coupling

A file that has anti-pattern DEBT from Phase 1 AND coupling hotspot DEBT from Phase 2 is a compounded risk: it is both structurally broken AND tightly coupled. Tag it as a RISK:

```bash
bun tools/tag-store.ts write --tag '{
  "target_type": "FILE",
  "target_ref": "src/handlers/deviceDataHandler.ts",
  "target_repo": "'"$REPO"'",
  "kind": "RISK",
  "value": "{\"subkind\": \"compounded-migration-risk\", \"evidence\": [\"anti-pattern: dynamodb-scan-antipattern (Phase 1)\", \"coupling-hotspot: outgoing_calls=12 (Phase 2)\"], \"blast_radius\": \"CRITICAL\", \"migration_impact\": \"This file must be refactored before migration can proceed: it has both a blocking anti-pattern and high coupling that would propagate migration failures to 12 downstream components.\"}",
  "confidence": 0.85,
  "weight_class": "MACHINE",
  "source_tool": "arch-assess-debt",
  "source_query": "cross-phase correlation",
  "source_evidence": "Phase 1: DEBT/VALIDATED anti-pattern tag exists; Phase 2: DEBT/CANDIDATE coupling-hotspot tag exists",
  "status": "CANDIDATE",
  "session_id": "'"$SESSION"'"
}' --session $SESSION
```

---

## Phase 3: Documentation Debt Mining (arch-docs via qmd)

### 3a. Index the Documentation Directory

```bash
# Confirm a docs directory exists
ls "${REPO}/docs" 2>/dev/null || ls "${REPO}/adr" 2>/dev/null || ls "${REPO}/design" 2>/dev/null

# Add the docs collection (use whichever path exists)
qmd collection add "${REPO}/docs" --name "${SESSION}-docs"
```

**If no docs directory exists:** skip Phase 3 and note `doc_debt_coverage: none` in Phase 4 synthesis. Do not invent doc debt from code comments alone.

**Priority document order** (highest architectural signal first):
1. ADR files (`adr/`, `docs/adr/`, `*.adr.md`) — these capture explicit decisions and their known tradeoffs
2. Design docs (`docs/design/`, `docs/architecture/`) — these describe intended structure vs. actual
3. RFCs and proposals (`docs/rfc/`, `proposals/`) — capture debt that was proposed but not yet implemented
4. General READMEs — lowest signal; mostly marketing and onboarding copy, rarely architectural

### 3b. Verify Collection Was Added

```bash
# Confirm collection was added successfully
qmd collection list
```

If the collection name `${SESSION}-docs` is not in the output, re-run `qmd collection add` with the corrected path before proceeding to queries. This catches the common failure where `collection add` silently writes nothing.

### 3c. Query for Debt Keywords

Run each query separately and record results. Use exact phrases -- qmd uses semantic similarity, so broad queries are fine.

```bash
# Query 1: Explicit tech debt acknowledgement
qmd query "technical debt known issues deferred work" --collection "${SESSION}-docs" --top-k 5

# Query 2: Migration blockers and deprecation
qmd query "migration deprecated legacy replace rewrite" --collection "${SESSION}-docs" --top-k 5

# Query 3: Deferred decisions and TODOs in design docs
qmd query "TODO FIXME not yet implemented deferred decision" --collection "${SESSION}-docs" --top-k 5

# Query 4: Known architectural problems
qmd query "architectural limitation scaling bottleneck performance issue" --collection "${SESSION}-docs" --top-k 5
```

### 3d. Write DEBT and RISK Tags for Document-Sourced Findings

For each document excerpt that names a concrete problem (not general commentary):

```bash
bun tools/tag-store.ts write --tag '{
  "target_type": "FILE",
  "target_ref": "docs/adr/0012-dynamodb-scan-deferral.md",
  "target_repo": "'"$REPO"'",
  "kind": "DEBT",
  "value": "{\"subkind\": \"documented-deferral\", \"source_phase\": \"arch-docs\", \"document_type\": \"ADR\", \"blast_radius\": \"HIGH\", \"migration_impact\": \"ADR-0012 explicitly deferred fixing the DynamoDB scan pattern; migration readiness requires this deferral to be resolved.\", \"excerpt\": \"We accept the table scan anti-pattern for now; re-evaluate at 10k device scale.\"}",
  "confidence": 0.80,
  "weight_class": "MACHINE",
  "source_tool": "qmd",
  "source_query": "technical debt known issues deferred work",
  "source_evidence": "ADR-0012, section 3: explicit deferral statement",
  "status": "CANDIDATE",
  "session_id": "'"$SESSION"'"
}' --session $SESSION
```

**Confidence for Phase 3 DEBT tags:**
- ADR explicitly deferred the problem → `0.80` (strong signal, human-authored)
- Design doc mentions "limitation" or "known issue" → `0.65` (moderate signal)
- README mentions "TODO" in a design section → `0.50` (weak signal — README TODOs are often stale)

**Do not write DEBT tags for:**
- General README intro copy ("this service handles X")
- Installation instructions
- Marketing language ("blazing fast", "enterprise-grade")
- Changelog entries that describe what was fixed in the past

### 3e. Clean Up qmd Collection

```bash
qmd collection remove "${SESSION}-docs" 2>/dev/null || true
```

---

## Phase 4: Synthesis — Ranked Remediation List

**Blast-radius checkpoint before ranking:** Re-apply the blast-radius lens from the introduction. A CRITICAL anti-pattern in an unused code path has less migration impact than a MEDIUM coupling hotspot in the service's primary event consumer. Entry-point files (Lambda handlers, MQTT consumers, HTTP routes) carry higher blast radius than equivalent issues in internal utilities at the same confidence level. Rank accordingly.

Aggregate all DEBT and RISK tags written in Phases 1-3 and rank them.

### 4a. Collect All Debt and Risk Findings

```bash
# All DEBT and RISK tags in session, grouped by file
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT target_ref, kind, json_extract(value,'$.subkind') as subkind, json_extract(value,'$.blast_radius') as blast_radius, confidence, weight_class, status FROM tags WHERE session_id='$SESSION' AND kind IN ('DEBT','RISK') AND status NOT IN ('REJECTED') ORDER BY confidence DESC, blast_radius DESC"
```

### 4b. Apply Severity Ranking Formula

Severity = `blast_radius_score × migration_impact_score × confidence`

| blast_radius | Score |
|-------------|-------|
| CRITICAL | 4 |
| HIGH | 3 |
| MEDIUM | 2 |
| LOW | 1 |

**Highest severity first.** Within the same severity, order by confidence descending.

**Ranking tiebreaker rules:**
1. VALIDATED status ranks above CANDIDATE (deterministic evidence over probabilistic)
2. Files tagged in multiple phases (anti-pattern + coupling + doc) rank above files tagged in only one phase
3. Files at service entry points (route handlers, Lambda entry points, event consumers) rank above internal utility files of equal severity — they have larger blast radius at cut-over

### 4c. Write the Remediation Summary

Output a ranked table. Example format:

```
DEBT REMEDIATION LIST — session: $SESSION — repo: $REPO
Generated by: arch-assess-debt (arch-structure → arch-observe → arch-docs)

Rank | File | Subkind | Blast Radius | Confidence | Source | Action
1    | src/handlers/deviceDataHandler.ts | compounded-migration-risk (RISK) | CRITICAL | 0.85 | Phase 1+2 | Fix DynamoDB scan AND decouple 12 downstream dependencies before migration
2    | src/handlers/deviceDataHandler.ts | dynamodb-scan-antipattern (DEBT) | HIGH | 0.90 | Phase 1 | Replace table scan with targeted query using GSI; resolve before traffic scaling
3    | src/handlers/deviceDataHandler.ts | coupling-hotspot (DEBT) | HIGH | 0.70 | Phase 2 | Extract sub-workflows into coordinator classes; reduce fan-out to <10
4    | src/config/secrets.ts | secret-hardcoded-ts (DEBT) | CRITICAL | 0.90 | Phase 1 | Move to Secrets Manager before migration; hardcoded values will break on credential rotation
5    | docs/adr/0012-dynamodb-scan-deferral.md | documented-deferral (DEBT) | HIGH | 0.80 | Phase 3 | ADR-0012 deferral must be formally resolved — reopen ADR and track fix
```

### 4d. Confirm Tag Count

```bash
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT kind, weight_class, status, COUNT(*) as count FROM tags WHERE session_id='$SESSION' AND kind IN ('DEBT','RISK') AND status NOT IN ('REJECTED') GROUP BY kind, weight_class, status ORDER BY count DESC"
```

**Expected output after all phases:**

| kind | weight_class | status | Source |
|------|-------------|--------|--------|
| DEBT | HUMAN | VALIDATED | Phase 1 (from anti-pattern PATTERN tags) |
| DEBT | MACHINE | CANDIDATE | Phase 2 (coupling hotspots) + Phase 3 (doc debt) |
| RISK | MACHINE | CANDIDATE | Phase 2 (compounded: anti-pattern + coupling) |

---

## Edge Cases

### No PATTERN Anti-Patterns Found

If Phase 1 returns 0 anti-pattern rows: the packs may not cover the repo's language or framework.

```bash
# Check what packs were used
cat $REPO/.archimedes/sessions/$SESSION/meta.json | jq '.pattern_packs'
```

- If packs do not match the service's tech stack → re-run arch-structure with correct packs, then return to Phase 1
- If packs match but 0 anti-patterns found → this is valid; the service may have no structural anti-patterns. Proceed to Phase 2 (coupling hotspots may still exist) and Phase 3 (doc debt may still exist). Note `anti_pattern_debt: none` in Phase 4 synthesis.

### No Documentation Directory

If `ls "${REPO}/docs"` returns nothing:
- Skip Phase 3 entirely
- Note `doc_debt_coverage: none — no docs directory found` in Phase 4 synthesis
- Check for inline ADRs: some repos store decisions as comments in `README.md` or as numbered issues. If found, manually read them and write DEBT tags with `confidence=0.50`.

### osgrep Not Indexed / Not Installed

If `osgrep list` returns zero or `osgrep` is not found:
- Phase 2 falls back to PATTERN density analysis only (Phase 2b, high-density files)
- Skip trace-based coupling analysis
- Note `coupling_analysis: partial — osgrep unavailable, density-only` in Phase 4 synthesis

```bash
# Fallback: identify god-files by PATTERN density alone (no osgrep needed)
bun tools/tag-store.ts query --session $SESSION --db $DB_PATH \
  --sql "SELECT target_ref, COUNT(*) as tag_count FROM tags WHERE session_id='$SESSION' AND kind='PATTERN' AND status NOT IN ('REJECTED') GROUP BY target_ref HAVING tag_count >= 5 ORDER BY tag_count DESC"
```

Files with 5+ PATTERN tags are high-complexity candidates. Write a DEBT tag with `subkind: high-pattern-density` and `confidence=0.60` (lower than trace-confirmed coupling).

### Conflicting Evidence Across Phases

If Phase 3 doc debt names a file that Phase 1 found clean (no anti-patterns), trust both:
- Phase 1 found no known anti-patterns → the specific anti-pattern patterns are not present
- Phase 3 doc named the file as problematic → the problem may be architectural (design-level) not pattern-level
- Write a RISK tag citing the doc source and note the absence of Phase 1 corroboration: `source_evidence: "Phase 3 doc debt (ADR-005) names this file; Phase 1 found 0 anti-pattern PATTERN tags for this target_ref"`

---

## Guardrails

- **Never assess debt without running arch-structure first** — PATTERN tags are the deterministic foundation. Coupling analysis and doc mining produce probabilistic signals; without the deterministic baseline, the assessment has no anchor and will produce false positives or miss critical structural problems.
- **Never equate "old code" with "debt"** — age is not evidence of a problem. A 5-year-old module with no anti-pattern tags, low coupling, and no doc-acknowledged problems is not debt. Only tag what has a measurable technical failure mode.
- **Never produce an unranked remediation list** — an unordered list implies all items are equally urgent, which is false and harmful. Teams that act on unranked lists fix easy items first; compounded-risk files at service entry points must be first.
- **Never apply the coupling hotspot threshold to DEFINITION or FRONTEND components** — type files and UI components legitimately import many types. The `outgoing_count >= 10` DEBT signal applies to ORCHESTRATION and INTEGRATION roles only. Check the ROLE tag (from arch-observe) before writing a coupling DEBT tag.
- **Never write DEBT tags from Phase 3 for README boilerplate** — marketing copy, installation instructions, and changelogs are not architectural documentation. Require a named decision, known limitation, or explicit deferral before writing a DEBT tag from a document source.
- **Never skip Phase 4 synthesis** — a session with DEBT and RISK tags but no ranked output is incomplete. The ranked remediation list is the deliverable.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Phase 1 returns 0 anti-patterns on a clearly messy repo | Wrong packs or wrong session | Check `meta.json` for packs; re-run arch-structure with correct packs |
| osgrep trace returns empty output | Index not built or stale | Run `osgrep index --path $REPO` then `osgrep list` |
| qmd query returns irrelevant results | Collection path incorrect or docs are sparse | Try `qmd collection list` to confirm collection was added; try broader query terms |
| Phase 2 produces >50 coupling hotspot candidates | Threshold too low OR monorepo root was indexed | Raise threshold to 15; confirm osgrep was indexed at service root, not monorepo root |
| Phase 1 DEBT count is 0 but PATTERN count is high | Pattern subkinds don't match the anti-pattern list in 1a | Run 1c to check for native DEBT tags; add additional subkinds to the IN clause based on actual subkind values in the session |
| Remediation list has >30 items | Too many phases produced candidates | Filter to CRITICAL and HIGH blast_radius only for the primary list; move MEDIUM/LOW to an appendix |
