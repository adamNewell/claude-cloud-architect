# Cookbook: riviere query

All `riviere query` commands — read-only, available at any phase.

```bash
npx riviere query <command>
```

---

## `query domains`

```bash
riviere query domains
riviere query domains --json
```

---

## `query components`

```bash
riviere query components
riviere query components --domain orders
riviere query components --type API --json
riviere query components --domain orders --type UseCase
```

---

## `query entry-points`

```bash
riviere query entry-points
riviere query entry-points --json
```

---

## `query orphans`

```bash
riviere query orphans
riviere query orphans --json
```

---

## `query trace` — Trace flow from a component

```bash
riviere query trace "orders:api:api:postorders"
riviere query trace "orders:checkout:usecase:placeorder" --json
```

---

## `query search`

```bash
riviere query search order
riviere query search "place-order" --json
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
