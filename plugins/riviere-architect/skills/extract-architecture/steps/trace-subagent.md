# Step 6 Subagent: Trace Map Generation

## Role

You are a subagent assigned to build feature-to-code trace entries for **one repository**.
You cross-reference documentation against extracted components to produce bidirectional
traceability mappings.

## Scope

**Your assigned repository only.** Read components extracted for this repo and match them
against available documentation. Do not trace components from other repositories.

When your trace output file is written, report completion to the orchestrator.

## Prerequisites

Read before starting:

- `.riviere/work/extract-{repo}.jsonl` — extracted components for your repository
- Wiki/docs content if available:
  - `wiki/` directory (if exists)
  - `README.md` at repository root
  - `docs/` directory (if exists)

## Process

**Prefix every message with:** `[Working through step-6 trace mapping for {repo}]`

### 1. Doc-to-code direction

For each documented feature or concept found in documentation:

1. Search wiki/README/docs for feature descriptions and section headings
2. Extract the feature name and a brief description
3. Match feature keywords against:
   - Component names in the extract JSONL
   - File paths referenced in components
   - Domain names and module names
4. Record which components implement each feature
5. Note the doc source (file path and line range)

### 2. Code-to-doc direction

For each extracted component in your repository:

1. Search documentation for references to this component by name
2. Check if the component's domain or module has wiki coverage
3. Look for the component's file path mentioned in any documentation
4. Flag components that have no documentation references

### 3. Confidence scoring

Assign confidence based on match quality:

| Match Type                | Confidence | Description                                                           |
| ------------------------- | ---------- | --------------------------------------------------------------------- |
| Direct name match in docs | **HIGH**   | Component name or ID appears verbatim in documentation                |
| Semantic/fuzzy match      | **MEDIUM** | Feature description references related concepts, partial name overlap |
| No doc reference found    | **LOW**    | No documentation mentions this component; gap: "undocumented"         |

## Output

Write one JSON object per line to `.riviere/work/trace-{repo}.jsonl`:

**Doc-to-code entry:**

```json
{"feature":"Order Placement","direction":"doc-to-code","docSource":"wiki/orders.md:15-30","components":["orders:checkout:api:post-orders","orders:checkout:usecase:place-order"],"confidence":"HIGH"}
```

**Code-to-doc entry (with gap):**

```json
{"feature":"Inventory Reservation","direction":"code-to-doc","component":"inventory:stock:domainop:stock.reserve","docSources":[],"confidence":"LOW","gap":"undocumented"}
```

**Code-to-doc entry (documented):**

```json
{"feature":"Payment Processing","direction":"code-to-doc","component":"payments:stripe:usecase:charge-card","docSources":["wiki/payments.md:10-25","README.md:45-50"],"confidence":"HIGH"}
```

## Completion

Trace output file written at `.riviere/work/trace-{repo}.jsonl`. Your work is done —
report back to the orchestrator.

**Do not read `validate-orchestrator.md`.** Do not proceed further.
