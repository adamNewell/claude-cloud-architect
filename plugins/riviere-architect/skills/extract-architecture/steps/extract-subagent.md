# Step 3 Subagent: Extract Components

## Write Path

You produce JSONL.

## Role

You are a subagent assigned to extract components from **one repository**. Your output
is consumed downstream. You do not interact with the user.

## Scope

**Your assigned repository only.** Do not read or modify files outside your repository
root. Write staged JSONL only.

When your output files are written, report completion to the orchestrator.

## Prerequisites

Read these files before scanning:

- `.riviere/config/metadata.json` — conventions and module inference rules for this repo
- `.riviere/config/domains.json` — canonical domain names; use these exactly
- `.riviere/config/component-definitions.json` — extraction rules per component type

## Extraction Process

**No planning or counting. Extract directly.**

### 1. Find All Instances

For each component type in your repository, grep for its code signature using patterns
from `component-definitions.json`:

```bash
# Examples — actual patterns come from component-definitions.json
grep -rn "@Controller" src/
grep -rn "extends BaseUseCase" src/
grep -rn "@EventHandler" src/
grep -rn "\.subscribe(" src/         # MQTT / event subscriptions
```

This gives file paths and line numbers for ALL occurrences.

### 2. Process Each Match

For each grep result:

1. Read the file at that location
2. Infer the module using the priority chain from `metadata.json → Module Inference`:
   - Try Priority 1 (code-level signal) first — read the package/namespace/decorator
   - If not found, apply the Priority 2 path rule for this component type
   - If path is ambiguous, try Priority 3 (class/file name prefix)
   - If no signal matches, use the domain name as module and tag it `[?]`
3. Extract remaining component details (name, HTTP method, route, etc.)
4. Write one JSON object to the staged output file

### 3. Complete Each Type

Finish ALL matches for one component type before starting the next:

```text
APIs (@Controller): 12 matches → 18 endpoints staged
UseCases (extends BaseUseCase): 8 matches → 8 use cases staged
```

If a grep pattern doesn't work (e.g., complex dynamic patterns), note it in your
completion message to the orchestrator.

## Staged Output Format

Write one JSON object per line to `.riviere/work/extract-{repo}.jsonl`:

```json
{"type":"API","domain":"orders","module":"checkout","name":"post-orders","repository":"https://github.com/org/repo","filePath":"src/api/orders.ts","lineNumber":10,"apiType":"REST","httpMethod":"POST","httpPath":"/orders"}
{"type":"UseCase","domain":"orders","module":"checkout","name":"place-order","repository":"https://github.com/org/repo","filePath":"src/usecases/PlaceOrder.ts","lineNumber":5}
{"type":"DomainOp","domain":"orders","module":"domain","name":"order.begin","repository":"https://github.com/org/repo","filePath":"src/domain/Order.ts","lineNumber":23,"entity":"Order","operationName":"begin"}
{"type":"EventHandler","domain":"notifications","module":"handlers","name":"on-order-placed","repository":"https://github.com/org/repo","filePath":"src/handlers/OnOrderPlaced.ts","lineNumber":5,"subscribedEvents":["OrderPlaced"]}
```

Include only fields that apply to the component type. All required fields:

| Field            | All types        | Notes                                                               |
| ---------------- | ---------------- | ------------------------------------------------------------------- |
| type             | ✓                | API \| UseCase \| DomainOp \| Event \| EventHandler \| UI \| Custom |
| domain           | ✓                | Canonical name from domains.json                                    |
| module           | ✓                | Inferred via priority chain                                         |
| name             | ✓                | Kebab-case                                                          |
| repository       | ✓                | Full GitHub URL                                                     |
| filePath         | ✓                | Relative to repository root                                         |
| lineNumber       | ✓                | Integer                                                             |
| apiType          | API only         | REST \| GraphQL \| gRPC                                             |
| httpMethod       | REST API         | GET \| POST \| PUT \| PATCH \| DELETE etc.                          |
| httpPath         | REST API         | e.g., /orders/{id}                                                  |
| operationName    | GraphQL/DomainOp | e.g., getOrder / begin                                              |
| entity           | DomainOp         | Containing class name                                               |
| eventName        | Event            | e.g., OrderPlaced                                                   |
| subscribedEvents | EventHandler     | Array of event names                                                |
| route            | UI               | e.g., /checkout                                                     |
| customType       | Custom           | Registered custom type name                                         |

## Agentic Discovery (Prong 3)

For edge cases that grep patterns miss, use multi-file call-chain analysis:

1. If a grep pattern produces zero results but the component type is expected (based on
   classification.json characteristics), trace call chains from known entry points
2. Follow import chains 2-3 levels deep to find components with non-standard patterns
3. Check for dynamically registered components (reflection, decorators applied at runtime)

Tag any components discovered through agentic analysis with an additional JSONL field:
`"discoveryProng":"agentic"` alongside the standard component fields.

**Only use when:** Classification indicates this component type should exist but Prong 1 found
fewer than expected. Do not use agentic discovery by default.

## New Domain Discovery

If a component clearly belongs to a domain not listed in `domains.json`:

1. Do NOT use a name similar to an existing domain — check carefully
2. Append a row to `.riviere/work/domains-{repo}.md`:

```markdown
| {canonical-name} | {type} | {one-line description} | {repository-name} |
```

3. Use the new domain name in the staged JSON
4. Do NOT add the domain yourself — the orchestrator handles `add-domain`

## Output

Two files:

- `.riviere/work/extract-{repo}.jsonl` — one JSON object per component
- `.riviere/work/domains-{repo}.md` — new domain discoveries (header only if none found)

## Completion

Both output files are written. Your work is done — report back to the orchestrator.
