# Step 1: Understand the Codebase (Orchestrator)

## Objective

Coordinate repository scanning to understand codebase structure, conventions, and domain
boundaries. Produce canonical reference documents for subsequent steps.

## Setup

Create the staging directory and initialize the domain registry:

```bash
mkdir -p .riviere/work/ .riviere/config/
cat > .riviere/config/domains.md << 'EOF'
# Domain Registry

Single source of record for all discovered domains across all repositories.

Rules:
- Check this file before naming any domain. Use the canonical name if it exists.
- If a domain is not listed, stage a new entry in your per-repo domains file.
- If a domain exists but your repo also contains code for it, add your repo to its Repositories column.

| Domain Name | Type | Description | Repositories |
| ----------- | ---- | ----------- | ------------ |
EOF
```

## Domain Boundary Thinking Framework

Before finalizing domain discoveries, ask:

- **Do any two discovered domains always change together?** If yes, they may be one domain split artificially by repo boundaries.
- **Does a domain name reflect a business concept or a technical layer?** Technical layers (`infrastructure`, `shared`, `common`) are rarely true domains — they're likely `other` type.
- **Can you explain this domain's purpose in one sentence to a non-technical person?** If not, the boundary is unclear and needs user confirmation.
- **Are there components that don't fit any discovered domain?** These are signals of a missing domain or a miscategorized component.

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

The tool reads all `.riviere/work/domains-{repo}.md` files, applies three merge rules
(new → append, ADD → update Repositories, collision → flag), and writes the updated
`domains.md`. Near-duplicate names (Levenshtein distance ≤ 2) are flagged as conflicts.

If the tool exits with code 2, conflicts were detected — present them to the user for
resolution before continuing.

### 2. Confirm with user

Present the consolidated domain list from `domains.md`:

> "Here are the domains discovered across all repositories. Do these boundaries look correct?
> Any name changes or merges needed before we continue?"

Incorporate any corrections into `domains.md` now — this is the last chance before the
domain names propagate through the rest of the graph.

### 3. Merge metadata

Read all `.riviere/work/meta-{repo}.md` files and write `.riviere/config/metadata.md`:

- **Domains section:** reference `domains.md` (do not duplicate entries here)
- **Frameworks table:** deduplicate — same framework listed once even if in multiple repos
- **Conventions:** globally consistent patterns go in the main section; per-repo variations
  go under `## Repo Overrides`
- **Module Inference:** if the rule differs by repo, note each separately
- **Entry points:** merge all per-repo tables into one

## Output

Two artifacts produced by this step:

**1. `.riviere/config/domains.md`** — canonical domain registry:

```markdown
# Domain Registry

| Domain Name | Type   | Description                           | Repositories                     |
| ----------- | ------ | ------------------------------------- | -------------------------------- |
| orders      | domain | Core order placement and fulfillment  | orders-service                   |
| inventory   | domain | Stock levels and warehouse operations | inventory-service, shared-domain |
```

**2. `.riviere/config/metadata.md`** — codebase analysis:

```markdown
# Codebase Analysis

## Structure
- Repositories: [list of repo names and local paths]
- Source code: [e.g., src/, lib/, app/]
- Tests: [e.g., tests/, __tests__]

## Domains

@`.riviere/config/domains.md`

## Module Inference

| Priority | Signal                                          | Confidence | Notes |
| -------- | ----------------------------------------------- | ---------- | ----- |
| 1        | [Code-level signal discovered in this codebase] | HIGH       |       |
| 2        | [Path rule per component type]                  | MEDIUM     |       |
| 3        | [Class/file name prefix or suffix]              | LOW        |       |
| 4        | Domain name as module                           | LOW        |       |

**Path rules by component type:**
| Component Type | Path Rule                | Example                                 |
| -------------- | ------------------------ | --------------------------------------- |
| [type]         | [nth segment under root] | `src/orders/checkout/Foo.ts` → checkout |

## Frameworks
| Category        | Name | Version |
| --------------- | ---- | ------- |
| Web framework   |      |         |
| Event/messaging |      |         |
| Database        |      |         |

## Conventions
- File naming: [pattern]
- Class naming: [pattern]
- API pattern: [how to recognize]
- Use case pattern: [how to recognize]
- Entity pattern: [how to recognize]
- Event pattern: [how to recognize]

## Repo Overrides
[Conventions that differ per repository — format: "repo-name: override description"]

## Entry Points
| Type           | Location | Pattern |
| -------------- | -------- | ------- |
| API routes     |          |         |
| Event handlers |          |         |
```

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
- **`domains.md` merge produces duplicate rows:** Deduplicate by canonical name before presenting to user. If truly duplicate, keep the one with more repositories listed.

## Completion

**Step 1 complete.** Wait for user feedback before proceeding.

## Next Phase

Read `steps/configure-orchestrator.md`
