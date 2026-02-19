# Cookbook: qmd

Index for `qmd` — on-device hybrid search engine for markdown documentation.

| Need                                    | Load                              |
| --------------------------------------- | --------------------------------- |
| Collection setup, embeddings            | `cookbook/qmd/cli.md` (this file) |
| Search, retrieval, score interpretation | `cookbook/qmd/query.md`           |
| Wiki indexing workflow                  | `cookbook/qmd/builder.md`         |

---

## Installation

```bash
npm install -g @tobilu/qmd
# or
bun install -g @tobilu/qmd
```

Verify: `qmd --version`

---

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

---

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

---

## Generate Embeddings

Must run after adding collections before semantic search works:

```bash
qmd embed            # embed all indexed documents
qmd embed -f         # force re-embed everything
```

---

## Maintenance

```bash
qmd status           # index health and collections
qmd update           # re-index all collections
qmd update --pull    # re-index with git pull first
qmd cleanup          # remove orphaned data
```
