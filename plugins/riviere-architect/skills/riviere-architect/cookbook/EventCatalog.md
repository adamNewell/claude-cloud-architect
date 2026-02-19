# Cookbook: EventCatalog CLI

Complete command reference for `@eventcatalog/cli` — the CLI for documenting event-driven architectures with events, services, domains, channels, and more.

## What EventCatalog Does

EventCatalog creates a self-hosted, searchable wiki for your event-driven architecture. It manages: Events, Commands, Queries, Messages, Services, Domains, Channels, Entities, Data Stores, Data Products, Diagrams, Teams, and Users — all versioned and linked.

## Installation

```bash
# Run directly (no install)
npx @eventcatalog/cli <function> [args...]

# Or install globally
npm install -g @eventcatalog/cli
eventcatalog <function> [args...]
```

## Core Flags

```bash
--dir /path/to/catalog    # target a specific catalog directory
--help                    # show help
```

## Discovery

```bash
npx @eventcatalog/cli list         # list all available functions
npx @eventcatalog/cli --help       # show usage
```

## Output

All commands return JSON. Pipe to `jq` for filtering:

```bash
npx @eventcatalog/cli getEvents | jq '.[].id'
npx @eventcatalog/cli getEvents | jq 'length'
npx @eventcatalog/cli getEvents | jq '.[] | select(.version == "1.0.0")'
```

## Argument Types

| Type    | Format          | Example                 |
| ------- | --------------- | ----------------------- |
| String  | Plain or quoted | `"OrderCreated"`        |
| Number  | Numeric         | `42`                    |
| Boolean | true/false      | `true`                  |
| Object  | `'{...}'`       | `'{"latestOnly":true}'` |
| Array   | `'[...]'`       | `'["item1","item2"]'`   |

---

## Events

```bash
# Get a single event by ID (optional: version)
npx @eventcatalog/cli getEvent "OrderCreated"
npx @eventcatalog/cli getEvent "OrderCreated" "1.0.0"

# Get all events (optional: latestOnly, attachSchema)
npx @eventcatalog/cli getEvents
npx @eventcatalog/cli getEvents '{"latestOnly":true}'

# Write / create an event
npx @eventcatalog/cli writeEvent '{"id":"OrderCreated","name":"Order Created","version":"1.0.0","markdown":"## Order Created\nFired when an order is placed."}'

# Write event to a service (attaches relationship)
npx @eventcatalog/cli writeEventToService '{"id":"OrderCreated","version":"1.0.0"}' '{"id":"OrderService"}'

# Remove by path or by ID
npx @eventcatalog/cli rmEvent "events/OrderCreated/index.md"
npx @eventcatalog/cli rmEventById "OrderCreated"
npx @eventcatalog/cli rmEventById "OrderCreated" "1.0.0"

# Version (moves current → versioned directory)
npx @eventcatalog/cli versionEvent "OrderCreated"

# Attach files and schemas
npx @eventcatalog/cli addFileToEvent "OrderCreated" '{"content":"...","fileName":"diagram.png"}'
npx @eventcatalog/cli addSchemaToEvent "OrderCreated" '{"schema":"...","fileName":"schema.json"}'

# Check version exists (supports semver ranges)
npx @eventcatalog/cli eventHasVersion "OrderCreated" "1.0.0"
npx @eventcatalog/cli eventHasVersion "OrderCreated" ">=1.0.0"
```

---

## Commands

```bash
# Get a single command
npx @eventcatalog/cli getCommand "CreateOrder"
npx @eventcatalog/cli getCommand "CreateOrder" "1.0.0"

# Get all commands
npx @eventcatalog/cli getCommands
npx @eventcatalog/cli getCommands '{"latestOnly":true}'

# Write a command
npx @eventcatalog/cli writeCommand '{"id":"CreateOrder","name":"Create Order","version":"1.0.0","markdown":"..."}'

# Write command to service
npx @eventcatalog/cli writeCommandToService '{"id":"CreateOrder"}' '{"id":"OrderService"}'

# Remove
npx @eventcatalog/cli rmCommand "commands/CreateOrder/index.md"
npx @eventcatalog/cli rmCommandById "CreateOrder"
npx @eventcatalog/cli rmCommandById "CreateOrder" "1.0.0"

# Version
npx @eventcatalog/cli versionCommand "CreateOrder"

# Attach files and schemas
npx @eventcatalog/cli addFileToCommand "CreateOrder" '{"content":"...","fileName":"notes.md"}'
npx @eventcatalog/cli addSchemaToCommand "CreateOrder" '{"schema":"...","fileName":"schema.json"}'

# Check version
npx @eventcatalog/cli commandHasVersion "CreateOrder" "1.0.0"
```

---

## Queries

```bash
# Get a single query
npx @eventcatalog/cli getQuery "GetOrder"
npx @eventcatalog/cli getQuery "GetOrder" "1.0.0"

# Get all queries
npx @eventcatalog/cli getQueries
npx @eventcatalog/cli getQueries '{"latestOnly":true}'

# Write a query
npx @eventcatalog/cli writeQuery '{"id":"GetOrder","name":"Get Order","version":"1.0.0","markdown":"..."}'

# Write query to service
npx @eventcatalog/cli writeQueryToService '{"id":"GetOrder"}' '{"id":"OrderService"}'

# Remove
npx @eventcatalog/cli rmQuery "queries/GetOrder/index.md"
npx @eventcatalog/cli rmQueryById "GetOrder"
npx @eventcatalog/cli rmQueryById "GetOrder" "1.0.0"

# Version
npx @eventcatalog/cli versionQuery "GetOrder"

# Attach files and schemas
npx @eventcatalog/cli addFileToQuery "GetOrder" '{"content":"...","fileName":"notes.md"}'
npx @eventcatalog/cli addSchemaToQuery "GetOrder" '{"schema":"...","fileName":"schema.json"}'

# Check version
npx @eventcatalog/cli queryHasVersion "GetOrder" "1.0.0"
```

---

## Services

```bash
# Get a single service
npx @eventcatalog/cli getService "OrderService"
npx @eventcatalog/cli getService "OrderService" "1.0.0"

# Get all services
npx @eventcatalog/cli getServices
npx @eventcatalog/cli getServices '{"latestOnly":true}'

# Write a service
npx @eventcatalog/cli writeService '{"id":"OrderService","name":"Order Service","version":"1.0.0","markdown":"..."}'

# Write service to domain
npx @eventcatalog/cli writeServiceToDomain '{"id":"OrderService"}' '{"id":"OrdersDomain"}'

# Remove
npx @eventcatalog/cli rmService "services/OrderService/index.md"
npx @eventcatalog/cli rmServiceById "OrderService"
npx @eventcatalog/cli rmServiceById "OrderService" "1.0.0"

# Version
npx @eventcatalog/cli versionService "OrderService"

# Add relationships to a service
npx @eventcatalog/cli addEventToService '{"id":"OrderCreated"}' '{"id":"OrderService"}' "sends"
npx @eventcatalog/cli addEventToService '{"id":"PaymentReceived"}' '{"id":"OrderService"}' "receives"
npx @eventcatalog/cli addCommandToService '{"id":"CreateOrder"}' '{"id":"OrderService"}' "receives"
npx @eventcatalog/cli addQueryToService '{"id":"GetOrder"}' '{"id":"OrderService"}' "receives"
npx @eventcatalog/cli addEntityToService '{"id":"Order"}' '{"id":"OrderService"}'
npx @eventcatalog/cli addDataStoreToService '{"id":"OrdersDB"}' '{"id":"OrderService"}' "writesTo"
npx @eventcatalog/cli addDataStoreToService '{"id":"OrdersDB"}' '{"id":"ReportingService"}' "readsFrom"

# Attach files
npx @eventcatalog/cli addFileToService "OrderService" '{"content":"...","fileName":"notes.md"}'

# Check version
npx @eventcatalog/cli serviceHasVersion "OrderService" "1.0.0"

# Get OpenAPI / AsyncAPI spec files
npx @eventcatalog/cli getSpecificationFilesForService "OrderService"
```

Relationship directions:

- Events/Commands/Queries: `"sends"` | `"receives"`
- Data Stores: `"writesTo"` | `"readsFrom"`

---

## Domains

```bash
# Get a single domain
npx @eventcatalog/cli getDomain "OrdersDomain"
npx @eventcatalog/cli getDomain "OrdersDomain" "1.0.0"

# Get all domains
npx @eventcatalog/cli getDomains
npx @eventcatalog/cli getDomains '{"latestOnly":true}'

# Write a domain
npx @eventcatalog/cli writeDomain '{"id":"OrdersDomain","name":"Orders Domain","version":"1.0.0","markdown":"..."}'

# Remove
npx @eventcatalog/cli rmDomain "domains/OrdersDomain/index.md"
npx @eventcatalog/cli rmDomainById "OrdersDomain"
npx @eventcatalog/cli rmDomainById "OrdersDomain" "1.0.0"

# Version
npx @eventcatalog/cli versionDomain "OrdersDomain"

# Add relationships
npx @eventcatalog/cli addServiceToDomain '{"id":"OrderService"}' '{"id":"OrdersDomain"}'
npx @eventcatalog/cli addEventToDomain '{"id":"OrderCreated"}' '{"id":"OrdersDomain"}' "sends"
npx @eventcatalog/cli addCommandToDomain '{"id":"CreateOrder"}' '{"id":"OrdersDomain"}' "receives"
npx @eventcatalog/cli addQueryToDomain '{"id":"GetOrder"}' '{"id":"OrdersDomain"}' "receives"
npx @eventcatalog/cli addEntityToDomain '{"id":"Order"}' '{"id":"OrdersDomain"}'
npx @eventcatalog/cli addSubdomainToDomain '{"id":"CheckoutDomain"}' '{"id":"OrdersDomain"}'

# Ubiquitous Language
npx @eventcatalog/cli addUbiquitousLanguageToDomain "OrdersDomain" '{"term":"Order","definition":"A request to purchase one or more items"}'
npx @eventcatalog/cli getUbiquitousLanguageFromDomain "OrdersDomain"

# Attach files
npx @eventcatalog/cli addFileToDomain "OrdersDomain" '{"content":"...","fileName":"notes.md"}'

# Check version
npx @eventcatalog/cli domainHasVersion "OrdersDomain" "1.0.0"
```

---

## Channels

```bash
# Get a single channel
npx @eventcatalog/cli getChannel "orders.events"
npx @eventcatalog/cli getChannel "orders.events" "1.0.0"

# Get all channels
npx @eventcatalog/cli getChannels
npx @eventcatalog/cli getChannels '{"latestOnly":true}'

# Write a channel
npx @eventcatalog/cli writeChannel '{"id":"orders.events","name":"Orders Events","version":"1.0.0","markdown":"..."}'

# Remove
npx @eventcatalog/cli rmChannel "channels/orders.events/index.md"
npx @eventcatalog/cli rmChannelById "orders.events"
npx @eventcatalog/cli rmChannelById "orders.events" "1.0.0"

# Version
npx @eventcatalog/cli versionChannel "orders.events"

# Link messages to a channel
npx @eventcatalog/cli addEventToChannel '{"id":"OrderCreated"}' '{"id":"orders.events"}'
npx @eventcatalog/cli addCommandToChannel '{"id":"CreateOrder"}' '{"id":"orders.events"}'
npx @eventcatalog/cli addQueryToChannel '{"id":"GetOrder"}' '{"id":"orders.events"}'

# Check version
npx @eventcatalog/cli channelHasVersion "orders.events" "1.0.0"
```

---

## Entities

```bash
# Get a single entity
npx @eventcatalog/cli getEntity "Order"
npx @eventcatalog/cli getEntity "Order" "1.0.0"

# Get all entities
npx @eventcatalog/cli getEntities
npx @eventcatalog/cli getEntities '{"latestOnly":true}'

# Write an entity
npx @eventcatalog/cli writeEntity '{"id":"Order","name":"Order","version":"1.0.0","markdown":"..."}'

# Remove
npx @eventcatalog/cli rmEntity "entities/Order/index.md"
npx @eventcatalog/cli rmEntityById "Order"
npx @eventcatalog/cli rmEntityById "Order" "1.0.0"

# Version
npx @eventcatalog/cli versionEntity "Order"

# Check version
npx @eventcatalog/cli entityHasVersion "Order" "1.0.0"
```

---

## Data Stores

```bash
# Get a single data store
npx @eventcatalog/cli getDataStore "OrdersDB"
npx @eventcatalog/cli getDataStore "OrdersDB" "1.0.0"

# Get all data stores
npx @eventcatalog/cli getDataStores
npx @eventcatalog/cli getDataStores '{"latestOnly":true}'

# Write a data store
npx @eventcatalog/cli writeDataStore '{"id":"OrdersDB","name":"Orders Database","version":"1.0.0","markdown":"..."}'

# Write data store to service
npx @eventcatalog/cli writeDataStoreToService '{"id":"OrdersDB"}' '{"id":"OrderService"}'

# Remove
npx @eventcatalog/cli rmDataStore "datastores/OrdersDB/index.md"
npx @eventcatalog/cli rmDataStoreById "OrdersDB"
npx @eventcatalog/cli rmDataStoreById "OrdersDB" "1.0.0"

# Version
npx @eventcatalog/cli versionDataStore "OrdersDB"

# Attach files
npx @eventcatalog/cli addFileToDataStore "OrdersDB" '{"content":"...","fileName":"schema.sql"}' "1.0.0"

# Check version
npx @eventcatalog/cli dataStoreHasVersion "OrdersDB" "1.0.0"
```

---

## Data Products

```bash
# Get a single data product
npx @eventcatalog/cli getDataProduct "OrderAnalytics"
npx @eventcatalog/cli getDataProduct "OrderAnalytics" "1.0.0"

# Get all data products
npx @eventcatalog/cli getDataProducts
npx @eventcatalog/cli getDataProducts '{"latestOnly":true}'

# Write a data product
npx @eventcatalog/cli writeDataProduct '{"id":"OrderAnalytics","name":"Order Analytics","version":"1.0.0","markdown":"..."}'

# Write to domain / add to domain
npx @eventcatalog/cli writeDataProductToDomain '{"id":"OrderAnalytics"}' '{"id":"OrdersDomain"}'
npx @eventcatalog/cli addDataProductToDomain '{"id":"OrderAnalytics"}' '{"id":"OrdersDomain"}'

# Attach files
npx @eventcatalog/cli addFileToDataProduct "OrderAnalytics" '{"content":"...","fileName":"notes.md"}'

# Remove
npx @eventcatalog/cli rmDataProduct "dataproducts/OrderAnalytics/index.md"
npx @eventcatalog/cli rmDataProductById "OrderAnalytics"
npx @eventcatalog/cli rmDataProductById "OrderAnalytics" "1.0.0"

# Version
npx @eventcatalog/cli versionDataProduct "OrderAnalytics"

# Check version
npx @eventcatalog/cli dataProductHasVersion "OrderAnalytics" "1.0.0"
```

---

## Diagrams

```bash
# Get a single diagram
npx @eventcatalog/cli getDiagram "order-flow"
npx @eventcatalog/cli getDiagram "order-flow" "1.0.0"

# Get all diagrams
npx @eventcatalog/cli getDiagrams
npx @eventcatalog/cli getDiagrams '{"latestOnly":true}'

# Write a diagram
npx @eventcatalog/cli writeDiagram '{"id":"order-flow","name":"Order Flow","version":"1.0.0","markdown":"..."}'

# Attach a file
npx @eventcatalog/cli addFileToDiagram "order-flow" '{"content":"...","fileName":"flow.png"}'

# Remove
npx @eventcatalog/cli rmDiagram "diagrams/order-flow/index.md"
npx @eventcatalog/cli rmDiagramById "order-flow"
npx @eventcatalog/cli rmDiagramById "order-flow" "1.0.0"

# Version
npx @eventcatalog/cli versionDiagram "order-flow"

# Check version
npx @eventcatalog/cli diagramHasVersion "order-flow" "1.0.0"
```

---

## Messages (Cross-cutting)

```bash
# Who produces and consumes a message?
npx @eventcatalog/cli getProducersAndConsumersForMessage "OrderCreated"
npx @eventcatalog/cli getProducersAndConsumersForMessage "OrderCreated" "1.0.0"

# Which services consume a schema?
npx @eventcatalog/cli getConsumersOfSchema "events/OrderCreated/schema.json"

# Which services produce a schema?
npx @eventcatalog/cli getProducersOfSchema "events/OrderCreated/schema.json"

# Who owns a resource?
npx @eventcatalog/cli getOwnersForResource "OrderService"
npx @eventcatalog/cli getOwnersForResource "OrderService" "1.0.0"
```

---

## Teams

```bash
npx @eventcatalog/cli getTeam "platform-team"
npx @eventcatalog/cli getTeams
npx @eventcatalog/cli writeTeam '{"id":"platform-team","name":"Platform Team","markdown":"..."}'
npx @eventcatalog/cli rmTeamById "platform-team"
```

---

## Users

```bash
npx @eventcatalog/cli getUser "jsmith"
npx @eventcatalog/cli getUsers
npx @eventcatalog/cli writeUser '{"id":"jsmith","name":"Jane Smith","markdown":"..."}'
npx @eventcatalog/cli rmUserById "jsmith"
```

---

## Utilities

```bash
# Export the entire catalog as JSON
npx @eventcatalog/cli dumpCatalog
npx @eventcatalog/cli dumpCatalog > catalog.json

# Get EventCatalog configuration
npx @eventcatalog/cli getEventCatalogConfigurationFile
```

---

## Quick Reference — Command Pattern

Every resource follows the same CRUD pattern:

| Operation      | Pattern                                  | Example                         |
| -------------- | ---------------------------------------- | ------------------------------- |
| Read one       | `get{Resource} "id" ["version"]`         | `getEvent "OrderCreated"`       |
| Read all       | `get{Resource}s ['{"latestOnly":true}']` | `getEvents`                     |
| Write          | `write{Resource} '{...json...}'`         | `writeEvent '{...}'`            |
| Delete by path | `rm{Resource} "path/to/file"`            | `rmEvent "..."`                 |
| Delete by ID   | `rm{Resource}ById "id" ["version"]`      | `rmEventById "OrderCreated"`    |
| Version        | `version{Resource} "id"`                 | `versionEvent "OrderCreated"`   |
| Has version    | `{resource}HasVersion "id" "version"`    | `eventHasVersion "..." "1.0.0"` |
| Attach file    | `addFileTo{Resource} "id" '{...}'`       | `addFileToEvent "..."`          |
| Attach schema  | `addSchemaTo{Resource} "id" '{...}'`     | `addSchemaToEvent "..."`        |

Resources: `Event`, `Command`, `Query`, `Service`, `Domain`, `Channel`, `Entity`, `DataStore`, `DataProduct`, `Diagram`
