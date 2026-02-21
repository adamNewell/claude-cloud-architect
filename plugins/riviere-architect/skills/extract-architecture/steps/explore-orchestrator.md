# Step 1: Understand the Codebase (Orchestrator)

## Objective

Coordinate repository scanning to understand codebase structure, conventions, and domain
boundaries. Produce canonical reference documents for subsequent steps.

## Record Progress

```bash
bun tools/detect-phase.ts --project-root "$PROJECT_ROOT" --step explore --status started
```

## Setup

Create the staging directory and initialize the domain registry:

```bash
mkdir -p .riviere/work/ .riviere/config/
echo '{"domains":[]}' > .riviere/config/domains.json
```

## Domain Boundary Thinking Framework

Before finalizing domain discoveries, ask:

- **Do any two discovered domains always change together?** If yes, they may be one domain split artificially by repo boundaries.
- **Does a domain name reflect a business concept or a technical layer?** Technical layers (`infrastructure`, `shared`, `common`) are rarely true domains — they're likely `other` type.
- **Can you explain this domain's purpose in one sentence to a non-technical person?** If not, the boundary is unclear and needs user confirmation.
- **Are there components that don't fit any discovered domain?** These are signals of a missing domain or a miscategorized component.

## Scope Rule (No Autonomous Exclusions)

**Explore ALL repositories in REPO_PATHS — every single one.** Do not exclude or skip
repositories based on perceived role, repo type, or architectural "importance." Shared
libraries, IaC stacks, frontend component libraries, dev tooling, and debug services are
all part of the architecture. Excluding any repo produces an incomplete dependency graph.

If REPO_PATHS contains N repositories, exactly N explore subagents must be spawned.
There is no exception to this rule. If you believe a repo should be excluded, surface
it to the user explicitly — never make that decision autonomously.

## No Batching Rule

**One subagent per repository. One repository per subagent. Never batch.**

Batching means: assigning two or more repositories to a single subagent invocation.
Batching is **forbidden** regardless of:

- Repo size ("these are small shared libs")
- Repo type ("these are all infrastructure")
- Similarity ("these follow the same pattern")
- Context pressure ("spawning 36 agents is a lot")

**Why:** A batched subagent produces shallow exploration. It skips internal dependency
tracing, misses conventions, and produces incomplete metadata — corrupting every
downstream step that relies on per-repo facets. The graph cannot be trusted if any
repo was batched.

**Count verification:** Before spawning, count the repos in REPO_PATHS. After all
subagents complete, count the `meta-{repo}.jsonl` files in `.riviere/work/`. These
two numbers must match. If they don't, identify the missing repo and re-spawn its
subagent before proceeding.

## Spawn Subagents

Spawn one subagent per repository. Each subagent receives `steps/explore-subagent.md`
as its instruction set.

```text
AGENT INSTRUCTIONS: Read steps/explore-subagent.md and follow its instructions exactly.
REPOSITORY: {repository-name}
REPOSITORY ROOT: {local path to repository}
```

> **Single-repository codebases:** Follow `steps/explore-subagent.md` directly
> without spawning — you are both orchestrator and subagent.

## Wait and Merge

After all subagents complete:

### 1. Merge domain discoveries

```bash
bun tools/merge-domains.ts --project-root "$PROJECT_ROOT"
```

If the tool exits with code 2, conflicts were detected — present them to the user for
resolution before continuing.

### 1b. Triangulate discoveries (when multi-prong data available)

If subagents produced multi-prong tagged findings, run triangulation:

```bash
bun tools/triangulate.ts --project-root "$PROJECT_ROOT" \
  --input-dir "$PROJECT_ROOT/.riviere/work" \
  --output "$PROJECT_ROOT/.riviere/work/triangulated-explore.jsonl" \
  --prong-prefix "meta-"
```

Review the triangulation report:

- **HIGH confidence** items are auto-accepted
- **MEDIUM confidence** items are auto-accepted with a note
- **LOW confidence** items are flagged -- present to user alongside domain confirmation
- **Contradictions** are escalated -- present conflicting findings for user resolution

### 2. Discover nested dependencies (loop)

Read `internalDep` facets from each `.riviere/work/meta-{repo}.jsonl`. Deduplicate by repo name -- the
same dependency referenced from multiple repos produces one entry.

If `.riviere/config/repo-discovery.yaml` exists, use it to filter: only repos matching the
configured `github_org`, `ecr_account_id`, or `npm_scope` are considered internal. If the config
doesn't exist and internal dependencies were found, ask the user for org context to create it.

Optionally run the IaC scanner for additional coverage on repos that contain IaC files:

```bash
bun tools/discover-linked-repos.ts --project-root "$PROJECT_ROOT" {REPO_PATHS...}
```

Merge tool output with subagent findings. Deduplicate across both sources.

**If new internal repos were discovered** (not already explored):

1. Present them to the user:
   > "Subagents found references to these additional internal repos:
   > - **orders-api** (ECR image in `ecs-stack.ts:42`)
   > - **shared-lib** (`@org/shared-lib` import in `package.json`)
   >
   > Should I explore these too? Repos not available locally will need cloning first."

2. For each confirmed repo that exists locally, spawn a new explore subagent (same instructions as above).

3. After new subagents complete, merge their domain discoveries into `domains.json`.

4. **Repeat from the top of this step:** Check the new subagents' Internal Dependencies for further
   undiscovered repos. Continue until no new repos are found or all remaining repos are not locally available.

Track explored repos in a visited set to prevent cycles. Write the final manifest to
`.riviere/work/discovered-repos.json` for reference by later steps.

**If no new repos discovered:** Proceed to step 3.

### 3. Confirm domains with user

Present the consolidated domain list from `domains.json` (now including domains from all
repos — both originally provided and discovered during the loop):

> "Here are the domains discovered across all repositories. Do these boundaries look correct?
> Any name changes or merges needed before we continue?"

Incorporate any corrections into `domains.json` now — this is the last chance before the
domain names propagate through the rest of the graph.

### 4. Merge metadata

Run the build-metadata tool to merge per-repo facets into structured JSON:

```bash
bun tools/build-metadata.ts --project-root "$PROJECT_ROOT"
```

Output: `.riviere/config/metadata.json`

## Output

Two artifacts:

**`.riviere/config/domains.json`** -- canonical domain registry.

**`.riviere/config/metadata.json`** -- codebase analysis.

## Module Inference Reference

When filling the Module Inference section above, prioritize signals in this order:

1. **Code Signal (High Confidence):** Explicit declarations like `@Module` decorators, package.json `name` fields (in monorepos), or namespace declarations.
2. **Path Rule (Medium Confidence):** Directory structure mapping.
   - Example: `src/orders/checkout/` -> `checkout` module.
   - Rule: "2nd directory segment after src/"
3. **Name Convention (Low Confidence):** Prefixes/suffixes.
   - Example: `CheckoutOrderUseCase` -> `checkout` module.
4. **Fallback (Low Confidence):** If no module structure exists, map to the domain name.

**Cross-check:** A `CheckoutOrder` class inferred to belong to the `shipping` module is a signal to re-examine your rules.

## Error Recovery

- **Subagent returns incomplete output (missing meta or domains file):** Re-spawn that subagent for the affected repository only. Do not re-run all subagents.
- **Domain name collision between subagents (same concept, different names):** Do NOT pick one automatically — present both names to the user with the discovered evidence and ask them to decide.
- **`domains.json` merge produces duplicate rows:** Deduplicate by canonical name before presenting to user. If truly duplicate, keep the one with more repositories listed.

## Record Completion

```bash
bun tools/detect-phase.ts --project-root "$PROJECT_ROOT" --step explore --status completed
```

## Completion

**Step 1 complete.** Wait for user feedback before proceeding.

## Handoff

The `detect-phase.ts --status completed` call above automatically emits
`handoff-explore.json` with step context for the next agent. No further action needed.
