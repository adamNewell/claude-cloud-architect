# Cookbook: qmd wiki-build

Wiki indexing workflow for riviere-architect. Used in **Wiki Index** to register a wiki with qmd before Explore begins.

---

## Wiki Build Workflow

```bash
# 1. Add wiki/docs as collection
qmd collection add ./wiki --name wiki
qmd context add qmd://wiki "Project wiki — architecture, components, decisions"
qmd embed

# 2. Architecture discovery queries
qmd query "architecture overview" --json -n 5
qmd query "domains components services" --json -n 10
qmd query "data flow integrations" --json -n 5
qmd query "technology stack" --json -n 5
qmd query "architecture decisions why" --json -n 5

# 3. Read high-scoring pages in full
qmd get wiki/architecture.md --full
qmd multi-get "wiki/adr-*.md" --json

# 4. Save findings to .riviere/config/discovery-notes.md
```

---

## Multi-Wiki Setup (one collection per repo)

```bash
# Each repo gets its own named collection
qmd collection add ./wiki-api    --name api
qmd collection add ./wiki-worker --name worker

qmd context add qmd://api    "API service wiki — REST endpoints, auth, middleware"
qmd context add qmd://worker "Worker service wiki — queue consumers, jobs, events"

qmd embed

# Query a specific repo's wiki
qmd query "authentication flow" -c api --json
qmd query "event consumers" -c worker --json

# Cross-repo query (searches all collections)
qmd query "order placed event" --json
```
