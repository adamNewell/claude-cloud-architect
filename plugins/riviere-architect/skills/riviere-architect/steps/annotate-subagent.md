# Step 5 Subagent: Enrich Components

## Role

You are a subagent assigned to enrich DomainOps within **one repository**. You read
source files and write staged enrichment data. You do NOT call `enrich` directly —
concurrent enrich calls corrupt the graph (45–60% data loss observed in testing).

## Scope

**Your assigned checklist only.** Read source files within your repository root. Do not
stage enrichments for DomainOps outside your checklist.

When your staged output file is written, report completion to the orchestrator.

## Prerequisites

Read your assigned checklist before starting:

- `.riviere/work/enrich-{repo}.md` — your assigned DomainOp checklist

## Process

**Prefix every message with:** `[Working through step-5 checklist and marking items as done]`

**The checklist is the only source of work. Do not explore the codebase or generate your own list.**

1. Read your assigned checklist file
2. Find unchecked items `- [ ]`
3. For each item: read the source file, identify enrichment data (steps below), write staged JSON, mark done
4. Continue until all items are checked

### 1. Identify State Changes

Look for entity state transitions:

```typescript
this.status = 'placed';           // Draft → Placed
this.state = OrderState.CONFIRMED; // Placed → Confirmed
```

Capture as: `from:[States],to:[States]` (brackets = array, can list multiple)

Examples:

- `from:[Draft],to:[Placed]` — single state transition
- `from:[Draft,Pending],to:[Active]` — multiple source states

### 2. Identify Business Rules

Look for validation logic:

```typescript
if (this.items.length === 0) throw new Error('...');   // must have items
if (this.total <= 0) throw new Error('...');           // total must be positive
```

Capture as plain English rules.

### 3. Identify Operation Behavior

Look for what the operation reads, validates, modifies, and emits:

```typescript
// Reads (parameters and state accessed)
const items = this.items;             // reads: "this.items"
const total = params.amount;          // reads: "amount parameter"

// Validates (preconditions checked)
if (this.state !== 'Draft') throw     // validates: "state === Draft"
if (!items.length) throw              // validates: "items.length > 0"

// Modifies (state changes made)
this.state = 'Placed';                // modifies: "this.state ← Placed"
this.total = sum;                     // modifies: "this.total ← calculated sum"

// Emits (events published)
emit(new OrderPlaced(...));           // emits: "OrderPlaced event"
```

### 4. Write Staged Output

Write one JSON object per line to `.riviere/work/annotate-staged-{repo}.jsonl`. Include
only the fields you identified:

```json
{"id":"orders:domain:domainop:order.begin","entity":"Order","stateChanges":["from:[Draft],to:[Placed]"],"businessRules":["Order must have at least one item"],"reads":["this.items"],"validates":["items.length > 0"],"modifies":["this.state ← Placed"],"emits":["OrderPlaced event"]}
```

Do NOT call the `enrich` CLI. The coordinator runs all enrich calls sequentially after
all workers complete.

### 5. Mark Done

```markdown
- [x] orders:domainop:order.begin (src/domain/Order.ts:23)
```

## Completion

Staged output file written and all checklist items marked `- [x]`. Your work is done —
report back to the orchestrator.

**Do not read `validate-orchestrator.md`.** Do not proceed further.
