# Step 3: Extract Components (Orchestrator)

## Objective

Coordinate component extraction across repositories and populate the graph.

## Prerequisites

- **Do not use plan mode.** Execute directly.
- Read `.riviere/config/metadata.md` for conventions
- Read `.riviere/config/domains.md` for canonical domain names
- Read `.riviere/config/component-definitions.md` for extraction rules
- CLI installed: `npm install @living-architecture/riviere-cli`

> **Single-repository codebases:** Follow `references/phase-3-subagent.md` directly —
> you are both orchestrator and subagent. Call `add-component` directly rather than
> staging to JSONL.

## Initialize Graph

Run the initialization tool — it reads `domains.md` and `component-definitions.md` and
runs the full CLI sequence automatically:

```bash
bun tools/init-graph.ts
```

Source URLs are resolved from `.riviere/work/meta-{repo}.md` Root paths via git remote.
If resolution fails, supply them explicitly:

```bash
bun tools/init-graph.ts \
  --source-url orders-service=https://github.com/your-org/orders-service \
  --source-url payments=https://github.com/your-org/payments-service
```

Preview commands before running:

```bash
bun tools/init-graph.ts --dry-run
```

**Source of record:** `domains.md` is authoritative. If a new domain is discovered
during extraction, add it to `domains.md` first, then call `add-domain` manually.

## Spawn Workers

**⚠️ Concurrency constraint:** Workers must NOT call `add-component` directly —
concurrent writes corrupt the shared graph JSON. Workers write staged JSONL; the
coordinator serializes all CLI calls.

Spawn one worker per repository. Each receives `references/phase-3-subagent.md` as
its instruction set:

```text
AGENT INSTRUCTIONS: Read references/phase-3-subagent.md and follow its instructions exactly.
REPOSITORY: {repository-name}
REPOSITORY ROOT: {local path}
```

## Wait and Merge

After all workers complete:

### 1. New domain discoveries

Read all `.riviere/work/domains-{repo}.md` files. For each new domain found:

1. Append to `.riviere/config/domains.md`
2. Call `npx riviere builder add-domain --name "[name]" --system-type "[type]" --description "[desc]"`

### 2. Run CLI calls sequentially

For each `.riviere/work/extract-{repo}.jsonl` file (in any order), read each JSON
object and call `add-component`:

```bash
npx riviere builder add-component \
  --type "[type]" \
  --domain "[domain]" \
  --module "[module]" \
  --name "[name]" \
  --repository "[repository]" \
  --file-path "[filePath]" \
  --line-number "[lineNumber]"
  # plus type-specific flags from the staged JSON
```

Type-specific flags:

- API: `--api-type`, `--http-method`, `--http-path`
- DomainOp: `--entity`, `--operation-name`
- Event: `--event-name`, `--event-schema`
- EventHandler: `--subscribed-events`
- UI: `--route`
- Custom: `--custom-type`, `--custom-property` (repeatable, format: `key:value`)

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

If user reports missing components, update `.riviere/config/component-definitions.md`
with corrected patterns and re-extract.

## Output

Graph: `.riviere/[project-name]-[commit].json`

## Completion

Present extraction summary showing component counts by domain and type.

**Step 3 complete.** Wait for user feedback before proceeding.

## Next Phase

Read `references/phase-4.md`
