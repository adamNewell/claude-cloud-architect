# Step 6: Trace (Orchestrator)

## Objective

Build bidirectional traceability between features/docs and code components. This step
maps documented features to their implementing components and flags undocumented code,
providing a completeness view of the architecture graph.

## Record Progress

```bash
bun tools/detect-phase.ts --project-root "$PROJECT_ROOT" --step trace --status started
```

## Prerequisites

- Graph with enriched components from Step 5.
- Wiki indexed (optional but recommended) — run `bun tools/ingest-wiki.ts` if wiki
  content is available and not yet indexed.

> **Single-repository codebases:** Follow `steps/trace-subagent.md` directly —
> you are both orchestrator and subagent. Run `build-trace-map.ts` directly
> and review the output.

## Run Trace Map Generation

```bash
bun tools/build-trace-map.ts --project-root "$PROJECT_ROOT"
```

For single-repository codebases this single invocation is sufficient — skip to the
Review section.

## Spawn Workers

**Trigger:** 2 or more repositories with wiki/doc content indexed.

Spawn one worker per repository. Each worker produces per-repo trace entries by
cross-referencing that repository's components against available documentation.

Each worker receives `steps/trace-subagent.md` as its instruction set:

```text
AGENT INSTRUCTIONS: Read steps/trace-subagent.md and follow its instructions exactly.
REPOSITORY: {repository-name}
REPOSITORY ROOT: {local path}
```

Workers produce per-repo trace files at `.riviere/work/trace-{repo}.jsonl`.

## Wait and Merge

After all workers complete:

1. Concatenate, verify and deduplicate JSONL trace map:

```bash
cat .riviere/work/trace-*.jsonl > .riviere/work/trace-map.jsonl && jq -c '.' .riviere/work/trace-map.jsonl | sort -u > .riviere/work/trace-map-clean.jsonl && mv .riviere/work/trace-map-clean.jsonl .riviere/work/trace-map.jsonl
```

Invalid lines are silently dropped. Duplicate feature+component pairs are removed.

## Review

Present trace coverage statistics to the user:

### HIGH confidence mappings

Features with direct name matches between documentation and components. These represent
well-documented areas of the system.

### LOW confidence mappings

Components without documentation references — undocumented code. These are candidates
for documentation improvement.

### Documentation gaps

Documented features without matching components. These may indicate:

- Features that were removed but docs not updated
- Components missed during extraction (consider re-running Step 3)
- Features planned but not yet implemented

## Output

```text
.riviere/work/trace-map.jsonl
```

## Error Recovery

- **`build-trace-map.ts` fails:** Verify that extract JSONL files exist in `.riviere/work/`. If no extract files are found, Step 3 may not have completed. Check progress with `bun tools/detect-phase.ts --project-root "$PROJECT_ROOT"`.
- **Worker produces empty trace file:** The repository may have no documentation. This is acceptable — the trace map will simply have LOW confidence entries for all components in that repo.
- **Merged trace-map.jsonl contains malformed JSON lines:** Remove malformed lines and log them. Present to the user for manual review. Re-spawn the affected worker if the malformed count exceeds 10% of total entries.
- **Very low HIGH confidence count (<10%):** Documentation may be sparse or use different terminology than the codebase. This is informational — it does not block progression but should be reported to the user.

## Record Completion

```bash
bun tools/detect-phase.ts --project-root "$PROJECT_ROOT" --step trace --status completed
```

## Completion

```bash
jq -sc '{
  total: length,
  HIGH: [.[] | select(.confidence=="HIGH")] | length,
  MEDIUM: [.[] | select(.confidence=="MEDIUM")] | length,
  LOW: [.[] | select(.confidence=="LOW")] | length,
  undocumented: [.[] | select(.gap=="undocumented")] | length,
  coverage_pct: (((([.[] | select(.gap != "undocumented")] | length) / (length // 1)) * 100) | round),
  top_gaps: [.[] | select(.gap=="undocumented") | .feature] | .[0:10]
}' .riviere/work/trace-map.jsonl
```

Present the output to the user.

**Step 6 complete.** Wait for user feedback before proceeding.

## Handoff

The `detect-phase.ts --status completed` call above automatically emits
`handoff-trace.json` with step context for the next agent. No further action needed.
