# Step 1 Subagent: Scan Repository

## Role

You are a subagent assigned to scan **one repository** as part of Step 1. Your findings
feed into the orchestrator's merge step. You do not interact with the user.

## Scope

**Your assigned repository only.** Do not read or modify files outside your repository root.
Do not proceed to Configure. When your output files are written, you are done — report
completion to the orchestrator.

## Critical Constraints

**NEVER** report back to orchestrator before writing both output files (`.riviere/work/meta-{repo}.jsonl` and `.riviere/work/domains-{repo}.jsonl`).

## Prerequisites

Read `.riviere/config/domains.json` **before** scanning. You will need canonical domain names
when reporting what you find. If both files are empty or missing, that is expected — proceed
with scanning and stage all discovered domains as new.

## Three-Prong Discovery

For each discovery task, apply up to three prongs in order of reliability:

### Prong 1: Deterministic (always runs)

Grep-based pattern matching, decorator scanning, path conventions, package.json analysis.
This is the existing scanning approach described in "Where to Look" below.

### Prong 2: Semantic (when qmd indexed)

If qmd was indexed in Wiki Index, query the wiki collection for:

- Domain concepts and business terminology
- Architecture descriptions and system boundaries
- Component naming and module organization

Tag findings with `"prong":"semantic"` in output JSONL.

**Graceful degradation:** If qmd is not indexed, skip Prong 2 entirely. Do not error.

### Prong 3: Agentic (when classification warrants)

For complex multi-repo systems (classification.json -> repoCount > 2):

- Cross-repo dependency tracing beyond what IaC scanning finds
- Multi-file call-chain analysis to discover hidden domain boundaries
- Pattern inference from naming conventions across repositories

Tag findings with `"prong":"agentic"` in output JSONL.

**Default prong:** If no prong tag is specified, the finding came from Prong 1 (deterministic).

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

**a. Check `domains.json`** — if the domain is listed, use the canonical name exactly as
written. No abbreviations, no variations.

**b. If not listed** -- append a new line to `.riviere/work/domains-{repo}.jsonl`:

```jsonl
{"action":"new","name":"{canonical-name}","type":"{type}","description":"{one-line description}","repository":"{repository-name}"}
```

**c. If listed but this repo also contains code for it** -- append to
`.riviere/work/domains-{repo}.jsonl`:

```jsonl
{"action":"addRepo","name":"{canonical-name}","repository":"{repository-name}"}
```

The orchestrator reads this file after all subagents complete and updates the domain registry.

## Output

Write two files. Use `{repo}` = your repository name (no spaces, lowercase).

---

**`.riviere/work/meta-{repo}.jsonl`** -- your repository's metadata contribution.

Each line is a JSON object with a `facet` field identifying the type. Write one line per
facet discovered. Each line may include an optional `"prong"` field (`"deterministic"` |
`"semantic"` | `"agentic"`); if omitted, the finding is assumed from Prong 1 (deterministic).

```jsonl
{"facet":"structure","repo":"orders-service","root":"/abs/path","sourceDirs":["src/"],"testDirs":["test/"]}
{"facet":"framework","repo":"orders-service","category":"web","name":"NestJS","version":"10.3.0"}
{"facet":"framework","repo":"orders-service","category":"database","name":"TypeORM","version":"0.3.20"}
{"facet":"convention","repo":"orders-service","kind":"fileNaming","pattern":"{name}.{type}.ts","example":"place-order.use-case.ts"}
{"facet":"convention","repo":"orders-service","kind":"classNaming","pattern":"PascalCase{Type}","example":"PlaceOrderUseCase"}
{"facet":"convention","repo":"orders-service","kind":"apiPattern","pattern":"@Controller + route decorators"}
{"facet":"convention","repo":"orders-service","kind":"useCasePattern","pattern":"classes in src/use-cases/"}
{"facet":"convention","repo":"orders-service","kind":"entityPattern","pattern":"extends Aggregate in src/domain/"}
{"facet":"convention","repo":"orders-service","kind":"eventPattern","pattern":"implements DomainEvent in src/events/"}
{"facet":"convention","repo":"orders-service","kind":"mqttTopicPattern","pattern":"{tenant}/{domain}/{entity}/{action}"}
{"facet":"moduleInference","repo":"orders-service","priority":1,"signal":"code","construct":"@Module decorator","extraction":"decorator argument","confidence":"HIGH"}
{"facet":"moduleInference","repo":"orders-service","priority":2,"signal":"path","construct":"2nd segment under src/","extraction":"path split","confidence":"MEDIUM"}
{"facet":"moduleInference","repo":"orders-service","priority":3,"signal":"name","construct":"class prefix","extraction":"PascalCase first word","confidence":"LOW"}
{"facet":"entryPoint","repo":"orders-service","type":"apiRoutes","location":"src/api/","pattern":"@Controller + route decorators"}
{"facet":"entryPoint","repo":"orders-service","type":"eventHandlers","location":"src/handlers/","pattern":"@EventPattern decorators"}
{"facet":"entryPoint","repo":"orders-service","type":"mqttSubscriptions","location":"src/mqtt/","pattern":"@MessagePattern decorators"}
{"facet":"internalDep","repo":"orders-service","referencedRepo":"shared-lib","sourceType":"internal_package","evidence":"@org/shared-lib","location":"package.json:15"}
{"facet":"note","repo":"orders-service","text":"Uses CQRS pattern with separate read/write models"}
```

**Facet reference:**

| Facet             | Required fields                                                | Description                                    |
| ----------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| `structure`       | `repo`, `root`, `sourceDirs`, `testDirs`                       | Repository structure                           |
| `framework`       | `repo`, `category`, `name`, `version`                          | Framework/library                              |
| `convention`      | `repo`, `kind`, `pattern`                                      | Naming/coding convention (optional: `example`) |
| `moduleInference` | `repo`, `priority`, `signal`, `construct`, `confidence`        | Module inference rule (optional: `extraction`) |
| `entryPoint`      | `repo`, `type`, `location`, `pattern`                          | Entry point for extraction                     |
| `internalDep`     | `repo`, `referencedRepo`, `sourceType`, `evidence`, `location` | Cross-repo dependency                          |
| `note`            | `repo`, `text`                                                 | Free-form observation                          |

**What to look for (internal dependencies):**

- ECR image URIs matching the org's AWS account (e.g., `123456.dkr.ecr.*.amazonaws.com/{name}`)
- Lambda `Code.fromAsset('../path')`, `CodeUri: ../path/`, `filename = "../path"`
- Terraform `source = "../module"` or `source = "git::https://github.com/{org}/repo"`
- Org-scoped npm imports (e.g., `@org/internal-lib`)
- Service client calls referencing other internal services by name or URL

**Filtering:** Only report references that appear to be internal/organizational. Skip well-known
open-source packages (aws-sdk, lodash, express, etc.) and public registries.

---

**`.riviere/work/domains-{repo}.jsonl`** -- domain discoveries from this repository.

Each line is a JSON object with an `action` field. Include an optional `"prong"` field
when multi-prong discovery is active.

```jsonl
{"action":"new","name":"orders","type":"domain","description":"Core order placement and fulfillment","repository":"orders-service"}
{"action":"addRepo","name":"inventory","repository":"orders-service"}
```

Leave this file empty if no new domains were found and this repo's domains
are already fully represented in `domains.json`.

## Completion

Both output files are written. Your work is done — report back to the orchestrator.

**Do not read `configure-orchestrator.md`.** Do not proceed further.
