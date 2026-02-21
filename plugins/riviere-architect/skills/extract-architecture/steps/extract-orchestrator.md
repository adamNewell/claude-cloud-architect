# Step 3: Extract Components (Orchestrator)

## Objective

Coordinate component extraction across repositories and populate the graph.

## Record Progress

```bash
bun tools/detect-phase.ts --project-root "$PROJECT_ROOT" --step extract --status started
```

## Prerequisites

- Read `.riviere/config/metadata.json` for conventions
- Read `.riviere/config/domains.json` for canonical domain names
- Read `.riviere/config/component-definitions.json` for extraction rules
- CLI installed: `npm install @living-architecture/riviere-cli`

> **Single-repository codebases:** Follow `steps/extract-subagent.md` directly —
> you are both orchestrator and subagent. Call `add-component` directly rather than
> staging to JSONL.

## Initialize Graph

Run the initialization tool — it reads `domains.json` and `component-definitions.json` and
runs the full CLI sequence automatically:

```bash
bun tools/init-graph.ts --project-root "$PROJECT_ROOT"
```

Source URLs are resolved from `.riviere/work/meta-{repo}.jsonl` Root paths via git remote.
If resolution fails, supply them explicitly:

```bash
bun tools/init-graph.ts --project-root "$PROJECT_ROOT" \
  --source-url orders-service=https://github.com/your-org/orders-service \
  --source-url payments=https://github.com/your-org/payments-service
```

Preview commands before running:

```bash
bun tools/init-graph.ts --project-root "$PROJECT_ROOT" --dry-run
```

**Source of record:** `domains.json` is authoritative. If a new domain is discovered
during extraction, add it to `domains.json` first, then call `add-domain` manually.

## Spawn Workers

Workers write staged JSONL; the orchestrator replays it via `replay-staged-components.ts`.

Spawn one worker per repository. Each receives `steps/extract-subagent.md` as
its instruction set:

```text
AGENT INSTRUCTIONS: Read steps/extract-subagent.md and follow its instructions exactly.
REPOSITORY: {repository-name}
REPOSITORY ROOT: {local path}
```

## Lens Agents (Conditional)

Read `.riviere/config/classification.json` for recommended lenses. For each active lens,
spawn an additional specialized subagent after per-repo workers complete:

### Orchestration Lens

**Activates when:** `classification.json → characteristics.orchestration.detected === true`

Spawn one additional worker to extract workflow/orchestration components:

- Reads entry point hints from classification.json
- Extracts Step Functions state machine definitions, saga steps, workflow definitions
- Stages as custom type `Orchestration` in extract JSONL

### Integration Lens

**Activates when:** `classification.json → characteristics.repoCount > 1`

Spawn one additional worker for cross-repo linking preparation:

- Reads all per-repo extract JSONL files
- Identifies components that reference other repositories
- Stages cross-repo link hints in a separate JSONL file

Lens agent outputs are merged into the standard extract JSONL before replay.

## Wait and Merge

After all workers complete (including any lens agents):

### 1. New domain discoveries

```bash
bun tools/merge-domains.ts --project-root "$PROJECT_ROOT" --add-to-graph
```

If the tool exits with code 2, near-duplicate domain names were detected — present
them to the user for resolution before continuing.

### 2. Replay staged components

```bash
bun tools/replay-staged-components.ts --project-root "$PROJECT_ROOT"
```

Report: `.riviere/work/component-replay-report.json`

## Verify Extraction

Generate summary:

```bash
npx riviere builder component-summary > ".riviere/step-3-summary.json"
```

Check for:

- Domains with zero components
- Component types with zero instances
- Unexpected counts suggesting missed patterns

Offer to run a sub-agent to scan for components that may have been missed.

## Feedback

If user reports missing components, update `.riviere/config/component-definitions.json`
with corrected patterns and re-extract.

## Output

Graph: `.riviere/graph.json`

## Error Recovery

- **`bun tools/init-graph.ts --project-root "$PROJECT_ROOT"` fails:** Run with `--dry-run` first to preview commands. If the tool itself errors, check that `bun` is installed and that you are running from the skill root directory. Verify `tools/init-graph.ts` exists.
- **`replay-staged-components.ts` reports failures (exit code 2):** Open `.riviere/work/component-replay-report.json` for details. Failed components are logged with stdout/stderr. Fix the staged JSONL and re-run the tool — it skips already-added components.
- **Worker returns empty JSONL file:** Re-spawn that worker with explicit instruction to verify it can read `.riviere/config/metadata.json` and `.riviere/config/component-definitions.json` before scanning.
- **Component count is unexpectedly low (>50% below estimate):** Before re-running, check if `component-definitions.json` patterns are too restrictive. Update patterns first, then re-extract only the affected repository.

## Record Completion

```bash
bun tools/detect-phase.ts --project-root "$PROJECT_ROOT" --step extract --status completed
```

## Completion

Present extraction summary showing component counts by domain and type.

**Step 3 complete.** Wait for user feedback before proceeding.

## Handoff

The `detect-phase.ts --status completed` call above automatically emits
`handoff-extract.json` with step context for the next agent. No further action needed.
