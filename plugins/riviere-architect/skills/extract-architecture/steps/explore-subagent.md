# Step 1 Subagent: Scan Repository

## Role

You are a subagent assigned to scan **one repository** as part of Step 1. Your findings
feed into the orchestrator's merge step. You do not interact with the user.

## Scope

**Your assigned repository only.** Do not read or modify files outside your repository root.
Do not proceed to Configure. When your output files are written, you are done — report
completion to the orchestrator.

## Critical Constraints

**NEVER** report back to orchestrator before writing both output files (`.riviere/work/meta-{repo}.md` and `.riviere/work/domains-{repo}.md`).

## Prerequisites

Read `steps/constraints.md` before starting.

Read `.riviere/config/domains.md` **before** scanning. You will need canonical domain names
when reporting what you find. If the file is empty or missing, that is expected — proceed
with scanning and stage all discovered domains as new.

## Where to Look

Check these locations in your repository in order:

> **qmd:** If qmd was indexed in Wiki Index, run discovery queries against your repository's
> collection before manual file scanning. See `../../cookbook/qmd/query.md` for query patterns. Use
> results to orient the scan; verify key findings against source files.

1. **AI instruction files** (highest signal)
   - `CLAUDE.md`, `claude.md` in root and subdirectories
   - `AGENTS.md`, `agents.md`

2. **Documentation**
   - `/docs` folder
   - `README.md` files
   - Architecture decision records (ADRs)

3. **API specifications**
   - OpenAPI/Swagger specs
   - AsyncAPI specs (channels section defines MQTT/AMQP topics and their payload schemas)
   - GraphQL schemas

4. **MQTT topic patterns** (if the repo uses a message broker)
   - AsyncAPI spec channels — authoritative list of published and subscribed topics
   - Config files or constants defining topic strings (e.g., `topics.ts`, `mqtt-topics.js`, env vars)
   - Grep for subscription calls that trigger processing flows:

     ```bash
     grep -rn "\.subscribe(" src/
     grep -rn "mqttClient\." src/
     grep -rn "@MessagePattern\|@EventPattern" src/  # NestJS microservices
     grep -rn "client\.on\(" src/                    # raw MQTT.js
     ```

     - For each subscription found, record: topic pattern, handler location, what domain it belongs to
   - Distinguish *subscriptions* (inbound — trigger flows) from *publish* calls (outbound — exit points)

   Document in Entry Points as "MQTT subscriptions".

5. **Configuration files**
   - `package.json`, `tsconfig.json` (Node.js/TypeScript) — check for MQTT library dependencies (`mqtt`, `aedes`, `@nestjs/microservices`)
   - `pom.xml`, `build.gradle` (Java)
   - `requirements.txt`, `pyproject.toml` (Python)

6. **Code structure**
   - Folder organization
   - Naming patterns
   - Module boundaries

## Domain Discovery Protocol

For each domain you identify in this repository:

**a. Check `domains.md`** — if the domain is listed, use the canonical name exactly as
written. No abbreviations, no variations.

**b. If not listed** — append a new row to `.riviere/work/domains-{repo}.md`:

```
| {canonical-name} | {type} | {one-line description} | {repository-name} |
```

**c. If listed but this repo also contains code for it** — note it in
`.riviere/work/domains-{repo}.md`:

```
| {canonical-name} | (exists) | (exists) | ADD: {repository-name} |
```

The orchestrator reads this file after all subagents complete and updates `domains.md`.

## Output

Write two files. Use `{repo}` = your repository name (no spaces, lowercase).

---

**`.riviere/work/meta-{repo}.md`** — your repository's metadata contribution:

```markdown
## Repository: {repo-name}

### Structure
- Root: {absolute path}
- Source code: {paths}
- Tests: {paths}

### Frameworks
| Category        | Name | Version |
| --------------- | ---- | ------- |
| Web framework   |      |         |
| Event/messaging |      |         |
| Database        |      |         |

### Conventions
- File naming: {pattern}
- Class naming: {pattern}
- API pattern: {how to recognize}
- Use case pattern: {how to recognize}
- Entity pattern: {how to recognize}
- Event pattern: {how to recognize}
- MQTT topic pattern: {how topics are named, e.g., `{tenant}/{domain}/{entity}/{action}` — include wildcard characters if used}

### Module Inference

Document the signal priority chain you discovered for this repository. Agents in later
phases will follow this chain top-to-bottom for every component they extract.

**Priority 1 — Code-level signal (HIGH confidence):**
Scan 3-5 representative files across component types. Does any language construct
reliably express the module?
- Java/Kotlin: `package` declaration (e.g., `com.acme.orders.checkout` → module: `checkout`)
- C#: `namespace` (e.g., `Acme.Orders.Checkout` → module: `checkout`)
- NestJS: `@Module('checkout')` decorator
- Other: {pattern found, or "none — skip to path rule"}

If found, document it:
```

Code-level signal: {construct}
Extraction: {how to read the module value from it}
Example: {concrete instance from this repo}

```

**Priority 2 — Path rule (MEDIUM confidence):**
Path rules may differ by component type. For each type, identify which path segment
corresponds to the module boundary.

| Component Type | Segment rule                 | Verified example                                     |
| -------------- | ---------------------------- | ---------------------------------------------------- |
| API            | {e.g., segment 3 under src/} | `src/orders/checkout/OrdersController.ts` → checkout |
| UseCase        |                              |                                                      |
| DomainOp       |                              |                                                      |
| Event          |                              |                                                      |
| EventHandler   |                              |                                                      |

If all types share one rule, document a single row with type = "All".

**Priority 3 — Name convention (LOW confidence):**
Does the class or file name embed the module?
- e.g., `CheckoutOrderUseCase` → class prefix `Checkout` → module `checkout`
- e.g., `checkout-order.service.ts` → filename prefix → module `checkout`
- {pattern found, or "none"}

**Fallback:** If no signal matches, use the domain name as the module value and tag
the component `[?]` for review.

### Entry Points
| Type               | Location | Pattern |
| ------------------ | -------- | ------- |
| API routes         |          |         |
| Event handlers     |          |         |
| MQTT subscriptions |          |         |
| UI pages           |          |         |

### Notes
{Anything unusual about this repository's structure or conventions}
```

---

**`.riviere/work/domains-{repo}.md`** — domain discoveries from this repository:

```markdown
| Domain Name | Type     | Description                          | Repositories        |
| ----------- | -------- | ------------------------------------ | ------------------- |
| orders      | domain   | Core order placement and fulfillment | orders-service      |
| inventory   | (exists) | (exists)                             | ADD: orders-service |
```

Leave this file empty (header only) if no new domains were found and this repo's domains
are already fully represented in `domains.md`.

## Completion

Both output files are written. Your work is done — report back to the orchestrator.

**Do not read `configure-orchestrator.md`.** Do not proceed further.
