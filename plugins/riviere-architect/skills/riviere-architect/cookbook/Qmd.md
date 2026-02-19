# Cookbook: qmd

Complete command reference for `qmd` — on-device hybrid search engine for markdown documentation. Used in **Wiki Build** to index and search the project wiki.

## Installation

```bash
npm install -g @tobilu/qmd
# or
bun install -g @tobilu/qmd
```

Verify: `qmd --version`

## Collection Management

```bash
# Add a directory as a collection
qmd collection add ./wiki --name wiki
qmd collection add ./docs --name docs
qmd collection add . --name project          # current directory
qmd collection add ~/path/to/docs --name docs --mask "**/*.md"  # custom glob

# List all collections
qmd collection list

# Remove / rename
qmd collection remove wiki
qmd collection rename wiki project-wiki
```

## Context (Critical for Quality)

Context adds descriptive metadata — search results carry this context, making LLM selection far more accurate.

```bash
# Add context to a collection
qmd context add qmd://wiki "Project wiki — architecture, components, decisions"
qmd context add qmd://docs "Project documentation and guides"

# Add context from inside the directory
cd ./wiki && qmd context add "GitHub wiki for the project"

# Add global context
qmd context add / "Knowledge base for my-project"

# List / remove
qmd context list
qmd context rm qmd://wiki/old
```

## Generate Embeddings

Must run after adding collections before semantic search works:

```bash
qmd embed            # embed all indexed documents
qmd embed -f         # force re-embed everything
```

## Search Commands

| Command       | Type                 | Quality              | Speed   |
| ------------- | -------------------- | -------------------- | ------- |
| `qmd search`  | BM25 keyword only    | Good for exact terms | Fastest |
| `qmd vsearch` | Semantic vector only | Good for concepts    | Fast    |
| `qmd query`   | Hybrid + reranking   | Best overall         | Slower  |

```bash
# Keyword search
qmd search "authentication flow"
qmd search "API" -c docs                       # restrict to collection

# Semantic search
qmd vsearch "how login works"

# Hybrid (best quality — use this for architecture discovery)
qmd query "architecture overview"
qmd query "bounded context domain services"
qmd query "data flow request lifecycle"
qmd query "external integrations third party"
qmd query "technology stack frameworks database"
qmd query "architecture decisions rationale"
qmd query "deployment infrastructure cloud"
```

## Search Options

```bash
-n <num>              # number of results (default: 5)
-c, --collection      # restrict to collection
--all                 # return all matches
--min-score <num>     # filter by relevance (0.0–1.0)
--full                # show complete document content
--files               # output: docid,score,filepath,context (CSV)
--json                # structured JSON with snippets
--md                  # markdown output
```

## Score Interpretation

| Score   | Meaning             | Action                   |
| ------- | ------------------- | ------------------------ |
| 0.8–1.0 | Highly relevant     | Read in full             |
| 0.5–0.8 | Moderately relevant | Skim for key details     |
| 0.2–0.5 | Somewhat relevant   | Check if missing context |
| 0.0–0.2 | Low relevance       | Skip                     |

## Document Retrieval

```bash
# Get a specific document (full content)
qmd get wiki/architecture.md
qmd get wiki/architecture.md --full
qmd get wiki/architecture.md:50 -l 100      # start at line 50, max 100 lines
qmd get "#abc123"                            # retrieve by docid from search result

# Batch retrieval
qmd multi-get "wiki/*.md"
qmd multi-get "wiki/*.md" --json
qmd multi-get "wiki/*.md" --max-bytes 20480  # skip files > 20KB
qmd multi-get "doc1.md, doc2.md, #abc123"   # comma-separated list or docids

# List files in collection
qmd ls wiki
qmd ls wiki/subfolder
```

## Agent-Optimized Output Patterns

```bash
# Structured results for LLM processing
qmd query "architecture" --json -n 10

# File list with scores for triage
qmd query "error handling" --all --files --min-score 0.4

# Full content for context injection
qmd get wiki/architecture.md --full

# Batch content load
qmd multi-get "wiki/*.md" --json
```

## Maintenance

```bash
qmd status           # index health and collections
qmd update           # re-index all collections
qmd update --pull    # re-index with git pull first
qmd cleanup          # remove orphaned data
```

## Wiki Build Workflow Pattern

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
