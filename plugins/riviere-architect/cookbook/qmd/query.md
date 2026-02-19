# Cookbook: qmd query

Search and document retrieval commands for `qmd`. Used in **Explore** to discover architecture from wiki docs.

---

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

---

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

---

## Score Interpretation

| Score   | Meaning             | Action                   |
| ------- | ------------------- | ------------------------ |
| 0.8–1.0 | Highly relevant     | Read in full             |
| 0.5–0.8 | Moderately relevant | Skim for key details     |
| 0.2–0.5 | Somewhat relevant   | Check if missing context |
| 0.0–0.2 | Low relevance       | Skip                     |

---

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

---

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
