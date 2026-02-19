# Step 4: Link Components (Orchestrator)

## Objective

Trace operational connections between components to create the flow graph.

## Prerequisites

- **Do not use plan mode.** Execute directly.
- Graph with extracted components from Step 3.
- Read `.riviere/config/linking-rules.md` for cross-domain patterns.
- Read `.riviere/config/domains.md` — use canonical domain names when resolving cross-repo links.

> **Single-repository codebases:** Follow `steps/connect-subagent.md` directly —
> you are both orchestrator and subagent. Use `.riviere/connect-checklist.md` as the
> checklist file. Call the link CLI directly.

## Generate Checklist

```bash
npx riviere builder component-checklist --output=".riviere/connect-checklist.md"
```

## Spawn Workers

**Trigger:** 2 or more repositories, or checklist contains more than 50 unchecked items.

**Partition strategy:** One worker per repository — each worker traces links only within
its assigned repository's source files, but may link TO components in other repositories
using canonical names from `domains.md`.

1. Split the master checklist into per-repository sub-checklists by matching source file
   paths to their repository root:

```bash
mkdir -p .riviere/work/
# Split checklist by repository — one file per repo
# For each repository listed in .riviere/config/metadata.md, extract its entries:
while IFS= read -r repo_path; do
  repo_name=$(basename "$repo_path")
  grep "$repo_path" .riviere/connect-checklist.md > ".riviere/work/checklist-${repo_name}.md"
done < <(grep -oP '(?<=Root: ).*' .riviere/work/meta-*.md)

# Verify: each per-repo checklist should be non-empty
# If a checklist is empty, check that the repo root path in metadata.md matches
# the file paths recorded during extract step
```

2. Spawn one worker per repository. Each receives `steps/connect-subagent.md` as its
   instruction set:

```text
AGENT INSTRUCTIONS: Read steps/connect-subagent.md and follow its instructions exactly.
REPOSITORY: {repository-name}
REPOSITORY ROOT: {local path}
CHECKLIST: .riviere/work/checklist-{repo}.md
```

> **Note:** Concurrent `link` / `link-http` calls across workers are generally safe (small
> sequential appends). If a CLI call fails, the worker should retry once before flagging
> to the coordinator.

## Wait and Merge

After all workers complete:

1. Merge sub-checklists back into the master checklist:

```bash
cat .riviere/work/checklist-*.md > .riviere/connect-checklist.md
```

2. Verify all items are checked before proceeding.

## Validate

After linking, check the validation rules in `.riviere/config/linking-rules.md`. List any
components that violate the rules so the user can review.

## Feedback

If user reports problems or missing elements, identify the root cause, update the relevant
config files, and re-run the affected step.

## Error Recovery

- **Worker sub-checklist is empty after grep-split:** The repo root path in `metadata.md` may not match the file paths in the checklist. Open `.riviere/connect-checklist.md` and inspect actual path prefixes — update the grep pattern accordingly.
- **`link` or `link-http` CLI call fails:** Retry once. If it fails again, log the failed link with source/target details and continue. Present unresolved links to the user at the end.
- **Checklist items remain unchecked after all workers complete:** Assign remaining items to a cleanup pass — spawn one additional worker with only the unchecked items as its checklist.

## Completion

Present link summary showing total links created (sync vs async).

**Step 4 complete.** Wait for user feedback before proceeding.

## Next Phase

Read `steps/annotate-orchestrator.md`
