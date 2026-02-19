# Cookbook: riviere builder

All `riviere builder` commands — used in Phases 3–6 to build and modify the architecture graph.

```bash
npx riviere builder <command>
```

## Graph Validation Hook

`tools/validate-graph.ts` is a PostToolUse hook that runs after every `riviere builder` command and validates the graph at a depth appropriate to the current phase:

| Phase | Checks                                                                                        |
| ----- | --------------------------------------------------------------------------------------------- |
| 3     | Root fields, domain registry, component required fields, ID format, type-specific fields      |
| 4     | + Link referential integrity, self-referential links, valid link type enum                    |
| 5     | + DomainOp enrichment quality (stateChange format, non-empty businessRules, behavior entries) |
| 6     | + Orphan threshold analysis (warns if >20% of components are orphaned)                        |

Phase is auto-detected from graph state — no configuration needed.

This hook is registered automatically via `hooks/hooks.json` when the plugin is installed. No manual configuration required.

Exit code `2` means errors were found — Claude will stop and fix before continuing.

---

## Graph Initialization Tool

`tools/init-graph.ts` reads `domains.md` and `component-definitions.md` and runs the
full Extract initialization sequence automatically:

```bash
bun tools/init-graph.ts              # run
bun tools/init-graph.ts --dry-run    # preview commands only
bun tools/init-graph.ts \
  --source-url orders-service=https://github.com/org/orders-service \
  --source-url payments=https://github.com/org/payments-service
```

Runs in order: `init` → `add-source` → `add-domain` → `define-custom-type`.

Source URLs resolved from `.riviere/work/meta-{repo}.md` Root path → `git remote get-url origin`. Use `--source-url` to override.

Custom types parsed from the `## Custom Types` table in `component-definitions.md`
(written by Configure orchestrator for accepted proposals):

```markdown
| Name | Description | Required Properties | Optional Properties |
|------|-------------|---------------------|---------------------|
| BackgroundJob | Scheduled background task | schedule:string:Cron expression | timeout:number:Max run time |
```

Properties are semicolon-separated: `name:type:description;name2:type2:description2`.

---

## Extract: Initialize & Extract

### `builder init` — Create the graph

```bash
riviere builder init \
  --source "https://github.com/your-org/your-repo" \
  --domain '{"name":"orders","description":"Order management","systemType":"domain"}'

# Multiple sources + domains
riviere builder init --name "ecommerce" \
  --source https://github.com/your-org/orders \
  --source https://github.com/your-org/payments \
  --domain '{"name":"orders","description":"Order management","systemType":"domain"}' \
  --domain '{"name":"payments","description":"Payment processing","systemType":"domain"}'
```

Domain `systemType` values: `domain` | `bff` | `ui` | `other`

### `builder add-source` — Add a repository

```bash
riviere builder add-source --repository https://github.com/your-org/orders-service
```

### `builder add-domain` — Add a domain

```bash
riviere builder add-domain \
  --name orders \
  --system-type domain \
  --description "Order management"
```

### `builder define-custom-type` — Register custom component type

```bash
riviere builder define-custom-type \
  --name "BackgroundJob" \
  --description "Scheduled background task" \
  --required-property "schedule:string:Cron expression or interval" \
  --optional-property "timeout:number:Max run time in seconds"
```

### `builder add-component` — Add a component

Required flags depend on `--type`. All writes must be **sequential** — concurrent calls corrupt the graph.

```bash
# API
riviere builder add-component \
  --type API \
  --domain orders --module api \
  --name "post-orders" \
  --api-type REST --http-method POST --http-path "/orders" \
  --repository "https://github.com/your-org/repo" \
  --file-path "src/api/orders.ts" \
  --line-number 42

# UseCase
riviere builder add-component \
  --type UseCase \
  --domain orders --module checkout \
  --name "place-order" \
  --repository "https://github.com/your-org/repo" \
  --file-path "src/usecases/PlaceOrder.ts" \
  --line-number 10

# DomainOp
riviere builder add-component \
  --type DomainOp \
  --domain orders --module domain \
  --name "order.begin" \
  --entity Order --operation-name begin \
  --repository "https://github.com/your-org/repo" \
  --file-path "src/domain/Order.ts" \
  --line-number 23

# Event
riviere builder add-component \
  --type Event \
  --domain orders --module events \
  --name "order-placed" \
  --event-name "OrderPlaced" \
  --repository "https://github.com/your-org/repo" \
  --file-path "src/events/OrderPlaced.ts" \
  --line-number 1

# EventHandler
riviere builder add-component \
  --type EventHandler \
  --domain notifications --module handlers \
  --name "on-order-placed" \
  --subscribed-events "OrderPlaced" \
  --repository "https://github.com/your-org/repo" \
  --file-path "src/handlers/OnOrderPlaced.ts" \
  --line-number 5

# UI
riviere builder add-component \
  --type UI \
  --domain storefront --module pages \
  --name "checkout-page" \
  --route "/checkout" \
  --repository "https://github.com/your-org/repo" \
  --file-path "src/pages/Checkout.tsx" \
  --line-number 1

# Custom
riviere builder add-component \
  --type Custom \
  --domain jobs --module scheduler \
  --name "invoice-generator" \
  --custom-type BackgroundJob \
  --custom-property "schedule:0 9 * * 1" \
  --repository "https://github.com/your-org/repo" \
  --file-path "src/jobs/InvoiceGenerator.ts" \
  --line-number 8
```

### `builder component-summary` — Count by type and domain

```bash
riviere builder component-summary
riviere builder component-summary > .riviere/step-3-summary.json
```

---

## Connect: Link

### `builder component-checklist` — Generate linking checklist

```bash
riviere builder component-checklist --output ".riviere/connect-checklist.md"
riviere builder component-checklist --type API    # filter by type
```

### `builder link` — Link via code reference (function call)

```bash
riviere builder link \
  --from "orders:api:api:postorders" \
  --to-domain orders --to-module checkout --to-type UseCase --to-name "place-order" \
  --link-type sync

riviere builder link \
  --from "orders:checkout:domainop:orderbegin" \
  --to-domain orders --to-module events --to-type Event --to-name "order-placed" \
  --link-type async
```

Link types: `sync` (direct call) | `async` (fire-and-forget / event)

**Component ID format:** `{domain}:{module}:{type-lowercase}:{name}` — see Component ID Reference below.

### `builder link-http` — Link via HTTP path (finds API by path)

Use when you know the HTTP path but not the component ID:

```bash
riviere builder link-http \
  --path "/orders" --method POST \
  --to-domain orders --to-module checkout --to-type UseCase --to-name "place-order" \
  --link-type sync

riviere builder link-http \
  --path "/users/{id}" --method GET \
  --to-domain users --to-module queries --to-type UseCase --to-name "get-user" \
  --link-type sync
```

Handles path parameter variations (`{id}`, `:id`) automatically.

### `builder link-external` — Link to system outside the graph

```bash
riviere builder link-external \
  --from "payments:gateway:usecase:processpayment" \
  --target-name "Stripe" \
  --target-url "https://api.stripe.com" \
  --link-type sync

riviere builder link-external \
  --from "shipping:tracking:usecase:updatetracking" \
  --target-name "FedEx API" \
  --target-domain "shipping" \
  --link-type async
```

---

## Annotate: Enrich

### `builder component-checklist` — Generate enrichment checklist

```bash
riviere builder component-checklist --type DomainOp --output ".riviere/step-5-checklist.md"
```

### `builder enrich` — Add semantic info to DomainOp

All flags are repeatable. Enrichment is **additive** — re-running accumulates values.
**Must be run sequentially** — concurrent enrich calls cause 45–60% data loss.

```bash
riviere builder enrich \
  --id "orders:checkout:domainop:orderbegin" \
  --entity Order \
  --state-change "Draft:Placed" \
  --business-rule "Order must have at least one item" \
  --business-rule "Total must be positive" \
  --reads "this.items" \
  --reads "amount parameter" \
  --validates "items.length > 0" \
  --validates "state === Draft" \
  --modifies "this.state <- Placed" \
  --modifies "this.total <- calculated sum" \
  --emits "OrderPlaced event"

# Multiple source states
riviere builder enrich \
  --id "orders:checkout:domainop:ordercancel" \
  --entity Order \
  --state-change "Placed:Cancelled" \
  --state-change "Confirmed:Cancelled" \
  --business-rule "Cannot cancel a shipped order"
```

State change format: `from:to` or `from:[State1,State2]:to` for multiple sources.

---

## Validate: Validate

### `builder check-consistency` — Find orphans

```bash
riviere builder check-consistency
riviere builder check-consistency --json
```

### `builder validate` — Full schema validation

```bash
riviere builder validate
riviere builder validate --json
```

### `builder finalize` — Export final graph

```bash
riviere builder finalize
riviere builder finalize --output ./dist/architecture.json
```

---

## Component ID Reference

Format: `{domain}:{module}:{type-lowercase}:{name-lowercase-hyphenated}`

| Type         | ID Pattern                                | Example                                             |
| ------------ | ----------------------------------------- | --------------------------------------------------- |
| API          | `domain:module:api:name`                  | `orders:api:api:postorders`                         |
| UseCase      | `domain:module:usecase:name`              | `orders:checkout:usecase:placeorder`                |
| DomainOp     | `domain:module:domainop:entity.operation` | `orders:domain:domainop:order.begin`                |
| Event        | `domain:module:event:name`                | `orders:events:event:orderplaced`                   |
| EventHandler | `domain:module:eventhandler:name`         | `notifications:handlers:eventhandler:onorderplaced` |
| UI           | `domain:module:ui:name`                   | `storefront:pages:ui:checkoutpage`                  |

---

## Graph File Location

Default: `.riviere/graph.json`

Override with `--graph <path>` on any command.
