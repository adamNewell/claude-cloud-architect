# Step 2 Subagent: Define Extraction Rules

## Role

You are a subagent assigned to define extraction rules for **one component type in one
repository**. Your output feeds into the orchestrator's merge step. You do not interact
with the user.

## Scope

**Your assigned component type and repository only.** Do not scan other repositories.
Do not define rules for other component types.

If you encounter patterns that clearly belong to a different type, note them briefly at
the end of your output file — do not define rules for them.

## Prerequisites

Read these files before beginning:

- `.riviere/config/metadata.json` -- codebase conventions, frameworks, module inference rules
- `.riviere/config/domains.json` -- canonical domain names; use these exactly in all examples

Scan only within your assigned **REPOSITORY ROOT**. Do not read files outside it.

## Component Type Definitions

| Type         | Definition                                          |
| ------------ | --------------------------------------------------- |
| UI           | User-facing screens/pages                           |
| API          | HTTP endpoints                                      |
| UseCase      | Application service coordinating a user goal        |
| DomainOp     | Business logic — aggregate methods, domain services |
| Event        | Domain event published after something happens      |
| EventHandler | Subscriber that reacts to an event                  |

## Classification Thinking Framework

Before classifying any component, ask yourself:

- **Decision vs. coordination?** Does this class make a business decision itself, or does it coordinate decisions made by other classes? Decision → `DomainOp`. Coordination → `UseCase`.
- **Who calls it?** If it's called by an HTTP controller, it's likely a `UseCase`. If called by a `UseCase`, it's likely a `DomainOp`.
- **Does it cross domain boundaries?** A class calling into multiple domains is almost certainly a `UseCase`, not a `DomainOp`.
- **Is the name misleading?** Infrastructure names (`Service`, `Manager`, `Helper`) do not determine type — look at what the class actually does.

## Define the Extraction Rule

Grep and read representative files for your assigned type. Look for:

1. **Where they live** — which directories contain this type
2. **Class pattern** — base class, decorator, or naming convention that identifies it
3. **What to select** — class-level? individual methods? file-level?
4. **Schema fields** — how to read each required field from the code

**Avoid over-fitting:** Location should be broad (e.g., `src/` or `apps/`). Let class
pattern and select do the identification work.

**Schema fields only.** Run `npx riviere builder add-component --help` to see valid
fields per type. Do not invent fields not in the schema.

### Extraction Rule Format

```markdown
## [ComponentType]

### Identification

**Location:** [broad folder — avoid over-specific paths]

**Class pattern:** [base class, decorator, or naming convention]

**Select:** [what to extract — class, methods, etc.]

### Fields (schema fields only)

| Schema Field | Source in Code    |
| ------------ | ----------------- |
| [field]      | [where to get it] |

### Exclude

- [patterns to skip]

### Example

[Brief code snippet showing what matches and what doesn't]
```

### Critical: Rules Only

Define **patterns** for finding components. Do NOT list actual components found.

- **Wrong:** "Components: order-begin, order-confirm, order-cancel"
- **Right:** "Pattern: public methods in classes extending Aggregate"

One brief example per rule is acceptable to illustrate the pattern.

### Reference Example (DomainOp)

```markdown
## DomainOp

### Identification

**Location:** `src/domain/`

**Class pattern:** extends `Aggregate`

**Select:** public methods

### Fields

| Field     | Source                |
| --------- | --------------------- |
| entity    | Containing class name |
| operation | Method name           |

### Exclude

- Private methods
- Getters (`get*`, `is*`, `has*`)
- Static hydration (`hydrate*`)

### Example

\`\`\`typescript
// src/domain/employee/employee.ts
export class Employee extends Aggregate {
  static register(...) { ... }        // ✓ DomainOp: Employee.register
  public remove(...) { }              // ✓ DomainOp: Employee.remove
  private applyRegistered() { }       // ✗ private
  public getState() { }               // ✗ getter
}
\`\`\`
```

## Semantic Discovery (Prong 2)

If qmd is indexed, supplement your grep-based pattern discovery with semantic queries:

1. Query qmd for descriptions of this component type's patterns in the codebase documentation
2. Look for naming conventions or architectural patterns described in docs
3. Cross-reference doc-described patterns with grep findings

Tag any rules discovered through semantic search with `"prong":"semantic"` in the JSONL output.

**Graceful degradation:** If qmd is not available, skip this section entirely.

@../../cookbook/qmd/query.md

## Custom Type Detection

While scanning for your assigned type, watch for patterns that don't fit any built-in
type. Append a Proposed Custom Types section to your output:

```markdown
## Proposed Custom Types

| Pattern                        | Suggested Name  | Notes                   |
| ------------------------------ | --------------- | ----------------------- |
| Background jobs in `src/jobs/` | `BackgroundJob` | cron-scheduled, no HTTP |
```

Leave this section empty (header only) if no candidates are found. Do NOT decide whether
to accept — the orchestrator consolidates proposals and asks the user once.

## Linking Pattern Discovery

While scanning for your component type, look for how it connects to other components.

### HTTP Client Mappings

If components of this type make HTTP calls to other services, identify the client
variable and its target domain:

```markdown
## HTTP Clients

| Client Pattern | Target Domain | Internal/External |
| -------------- | ------------- | ----------------- |
| `ordersApi`    | orders        | internal          |
| `stripeClient` | Stripe        | external          |
```

**Common patterns:** `*Client`, `*ApiClient`, `*Api`, `*Gateway`, `*Sdk`,
`axios.create(`, `new HttpClient(`, `constructor(private *Api:`

Cross-reference the target domain against `domains.json`. If the target is in another
repo, note the cross-repo mapping.

### Non-HTTP Linking Patterns

For message queues, MQTT subscriptions, event buses, or other non-HTTP connections:

```markdown
## [Pattern Name]

**Indicator:** [code pattern to scan for]
**From:** [component type]
**To:** [component type or external]
```

### Validation Rules

If this component type must always connect to certain other types, define a rule:

```markdown
## Validation

- [this component type] must link to [expected target]
- BFF APIs must link to backend or external (not just internal UseCase)
```

## Classification Anti-Patterns

**NEVER** classify a class that delegates to multiple domain services as a `DomainOp` — if it coordinates other domain services or use cases, it is a `UseCase`.

**NEVER** create a domain per repository — production codebases commonly split a single business domain across 2-3 repos (e.g., `orders-service` and `orders-worker`); a one-to-one assumption produces a structurally incorrect graph that cannot be fixed without restarting from Step 1. If two repositories serve the same business concept, they belong to the same domain. Check `domains.json` first.

**NEVER** infer module from utility, infrastructure, or shared library classes — names like `DatabaseHelper`, `HttpClient`, `EventBus` are infrastructure and do not reliably express a business module.

**NEVER** classify a saga orchestrator or process manager as a `UseCase` — if it manages long-running state across multiple steps or services, propose a custom type `Saga` instead.

**NEVER** mark a component as a `DomainOp` if it only reads data without making a business decision — read-only queries are domain operations only if they enforce business rules (e.g., eligibility checks).

## Output

Write one file: `.riviere/work/rules-{repo}-{type}.jsonl`

Use `{repo}` = repository name (lowercase, no spaces) and `{type}` = component type
lowercased (e.g., `rules-orders-service-domainop.jsonl`, `rules-payments-api.jsonl`).
**For single-repo setups:** Use `local` as the repository name (`rules-local-api.jsonl`).

Each line is a JSON object with a `kind` field. Write one line per rule/pattern discovered:

```jsonl
{"kind":"extractionRule","componentType":"API","repo":"orders-service","location":"src/","classPattern":"@Controller","select":"methods with @Get/@Post","fields":[{"schemaField":"httpMethod","source":"decorator name"},{"schemaField":"path","source":"decorator argument"}],"exclude":["health checks","metrics endpoints"]}
{"kind":"example","componentType":"API","repo":"orders-service","matches":true,"snippet":"@Get('/orders/:id') async getOrder(@Param('id') id: string)"}
{"kind":"example","componentType":"API","repo":"orders-service","matches":false,"snippet":"@Get('/health') async healthCheck()"}
{"kind":"customTypeProposal","name":"Saga","pattern":"Process managers in src/sagas/","instanceCount":4}
{"kind":"httpClient","clientPattern":"ordersApi","targetDomain":"orders","internal":true}
{"kind":"httpClient","clientPattern":"stripeClient","targetDomain":"Stripe","internal":false}
{"kind":"linkPattern","name":"MQTT event flow","indicator":"@MessagePattern","fromType":"EventHandler","toType":"Event"}
{"kind":"validationRule","rule":"API must link to UseCase or DomainOp","scope":"orders-service"}
```

**Kind reference:**

| Kind                 | Required fields                                                         | Description                                      |
| -------------------- | ----------------------------------------------------------------------- | ------------------------------------------------ |
| `extractionRule`     | `componentType`, `repo`, `location`, `classPattern`, `select`, `fields` | Main extraction pattern (optional: `exclude`)    |
| `example`            | `componentType`, `repo`, `matches`, `snippet`                           | Code example showing what matches/doesn't match  |
| `customTypeProposal` | `name`, `pattern`                                                       | Proposed custom type (optional: `instanceCount`) |
| `httpClient`         | `clientPattern`, `targetDomain`, `internal`                             | HTTP client to domain mapping                    |
| `linkPattern`        | `name`, `indicator`, `fromType`, `toType`                               | Non-HTTP linking pattern                         |
| `validationRule`     | `rule`, `scope`                                                         | Structural validation constraint                 |

## Completion

Output file is written. Your work is done — report back to the orchestrator.

**Do not read `extract-orchestrator.md`.** Do not proceed further.
