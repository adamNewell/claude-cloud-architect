# Step 1: Understand the Codebase (Orchestrator)

## Objective

Coordinate repository scanning to understand codebase structure, conventions, and domain
boundaries. Produce canonical reference documents for subsequent steps.

## Principles

- **Accuracy over speed** — Take time to find evidence, don't guess
- **Ask when uncertain** — If domain boundaries are unclear, ask the user
- **Domains span repositories** — A domain may have code in multiple repos; the domain
  registry is the single source of truth

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

## Spawn Subagents

Spawn one subagent per repository. Each subagent receives `references/phase-1-subagent.md`
as its instruction set.

```text
AGENT INSTRUCTIONS: Read references/phase-1-subagent.md and follow its instructions exactly.
REPOSITORY: {repository-name}
REPOSITORY ROOT: {local path to repository}
```

> **Single-repository codebases:** Follow `references/phase-1-subagent.md` directly
> without spawning — you are both orchestrator and subagent.

## Wait and Merge

After all subagents complete:

### 1. Merge domain discoveries

Read all `.riviere/work/domains-{repo}.md` files:

- **New rows** → append to `.riviere/config/domains.md`
- **`ADD: {repo}` rows** → add that repo name to the existing domain's Repositories column
- **Name collisions** → if two workers discovered what appears to be the same domain under
  different names, ask the user to resolve before proceeding

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

Domain types:
- `domain` — Core business domain (orders, inventory, shipping)
- `bff` — Backend-for-frontend, aggregates calls
- `ui` — User interface layer
- `other` — Infrastructure, shared libraries

## Module Inference

Signal priority chain — agents try signals in order and use the first match. Each inferred
module is tagged with confidence: `[HIGH]`, `[MEDIUM]`, `[LOW]`, or `[?]` (ambiguous).

| Priority | Signal                                          | Confidence | Notes                                                     |
| -------- | ----------------------------------------------- | ---------- | --------------------------------------------------------- |
| 1        | [Code-level signal discovered in this codebase] | HIGH       | e.g., package declaration, namespace, `@Module` decorator |
| 2        | Path rule per component type (see below)        | MEDIUM     | May differ by component type                              |
| 3        | Class/file name prefix or suffix                | LOW        | e.g., `CheckoutOrderUseCase` → checkout                   |
| 4        | Domain name as module                           | LOW        | Use only for single-module domains                        |
| —        | No signal matches                               | [?]        | Flag for review — do not guess                            |

**Path rules by component type:**
| Component Type | Path Rule                | Example                                 |
| -------------- | ------------------------ | --------------------------------------- |
| [type]         | [nth segment under root] | `src/orders/checkout/Foo.ts` → checkout |

**Cross-check:** After inferring a module, verify it is consistent with the component name.
A `CheckoutOrder` class inferred to module `shipping` is a signal to re-examine.

## Frameworks
| Category        | Name | Version |
| --------------- | ---- | ------- |
| Web framework   |      |         |
| Event/messaging |      |         |
| Database        |      |         |
| ...             |      |         |

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
| Type                | Location | Pattern |
| ------------------- | -------- | ------- |
| API routes          |          |         |
| Event handlers      |          |         |
| MQTT subscriptions  |          |         |
| UI pages            |          |         |
| ...                 |          |         |

## Notes
[Any other observations]
```

## Completion

**Step 1 complete.** Wait for user feedback before proceeding.

## Next Phase

Read `references/phase-2.md`
