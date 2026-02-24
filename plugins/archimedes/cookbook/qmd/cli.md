# qmd CLI Reference

<!-- Verified: qmd 1.0.7 -->

`qmd` is a documentation search and retrieval tool that indexes Markdown files with semantic understanding. It uses vector embeddings, BM25 full-text search, and LLM-powered reranking to find relevant documentation across collections.

**Important:** `qmd` is the **sole documentation search tool** in Archimedes. There is no `rlmgrep` — use `qmd` for all documentation mining tasks in the arch-docs workflow.

## Installation

`qmd` is typically installed globally via your system package manager or as a compiled binary. Verify installation:

```bash
qmd --version
```

Expected output:
```
qmd 1.0.7
```

## Adding a Documentation Collection

Register a directory of Markdown files as a searchable collection:

```bash
qmd collection add <path> --name <collection-name> [--mask <pattern>]
```

### Examples

Add all Markdown files in a project:
```bash
qmd collection add plugins/archimedes/docs --name arch-docs
```

The `--mask` flag (default: `**/*.md`) filters which files to index:
```bash
qmd collection add . --name my-project --mask "docs/**/*.md"
```

### Listing Collections

View all registered collections:
```bash
qmd collection list
```

View files in a specific collection:
```bash
qmd ls <collection-name>
qmd ls <collection-name>/<path>
```

### Managing Collections

Rename a collection:
```bash
qmd collection rename <old-name> <new-name>
```

Remove a collection:
```bash
qmd collection remove <collection-name>
```

## Searching and Querying

`qmd` offers three search modes: **query** (recommended), **search** (keyword), and **vsearch** (vector-only).

### Query Mode (Recommended)

Uses query expansion + semantic reranking for best relevance:

```bash
qmd query "<search term>"
```

Example: Find architectural decisions in your docs
```bash
qmd query "architectural decision patterns"
```

Filter to a specific collection:
```bash
qmd query "implementation strategy" -c arch-docs
```

Limit number of results (default: 5):
```bash
qmd query "design patterns" -n 10
```

### Keyword Search

Fast full-text search using BM25 (no LLM processing):

```bash
qmd search "<keyword>"
```

Example:
```bash
qmd search "error handling"
```

With collection filter:
```bash
qmd search "caching strategy" -c arch-docs
```

### Vector Search

Find semantically similar documents without reranking:

```bash
qmd vsearch "<semantic query>"
```

Example:
```bash
qmd vsearch "how to implement authentication"
```

This is useful when you want pure semantic similarity without the overhead of reranking.

## Search Options

Apply these flags to `query`, `search`, or `vsearch` commands:

| Option | Effect |
|--------|--------|
| `-n <num>` | Return N results (default: 5, or 20 for `--files`) |
| `--all` | Return all matches (combine with `--min-score` to filter) |
| `--min-score <num>` | Minimum similarity score threshold (0–100) |
| `--full` | Output complete document instead of snippet |
| `--line-numbers` | Include line numbers in output |
| `-c, --collection <name>` | Restrict search to a specific collection |

### Output Formats

By default, `qmd query` returns snippets with context. Choose a different format:

```bash
qmd query "topic" --json       # JSON with scores and snippets
qmd query "topic" --csv        # CSV format
qmd query "topic" --md         # Markdown format
qmd query "topic" --xml        # XML format
qmd query "topic" --files      # CSV: docid,score,filepath,context (20 results)
```

## JSON Output Mode

Get structured output for automation:

```bash
qmd query "authentication" --json
```

Output format:
```json
[
  {
    "docid": "#280cd3",
    "score": 0.88,
    "file": "qmd://arch-docs/auth/jwt.md",
    "title": "JWT Authentication",
    "snippet": "..."
  }
]
```

Fields:
- `docid`: Internal document identifier
- `score`: Similarity score (0–1, higher is better)
- `file`: Full document path with `qmd://` prefix
- `title`: Extracted document title
- `snippet`: Relevant excerpt with diff-style context markers

## Getting Full Documents

Retrieve entire files or sections from the index:

```bash
qmd get <docid-or-path> [-l <lines>] [--from <line-num>]
```

### Examples

Get a full document by path:
```bash
qmd get "qmd://arch-docs/plans/implementation.md"
```

Get first 30 lines:
```bash
qmd get "qmd://arch-docs/decisions/api-design.md" -l 30
```

Get lines 50–100 from a file:
```bash
qmd get "qmd://arch-docs/guide.md" --from 50 -l 50
```

## Multi-Get: Retrieve Multiple Documents

Fetch multiple files matching a glob or list:

```bash
qmd multi-get <pattern> [-l <lines>] [--max-bytes <num>] [--json|--csv|--md|--xml]
```

### Examples

Get all files in a subdirectory:
```bash
qmd multi-get "qmd://arch-docs/decisions/*.md"
```

Retrieve multiple files by comma-separated list:
```bash
qmd multi-get "doc1.md,doc2.md,doc3.md"
```

Limit output to first 20 lines per file:
```bash
qmd multi-get "docs/*.md" -l 20
```

Skip files larger than 5KB:
```bash
qmd multi-get "**/*.md" --max-bytes 5120
```

## Vector Embeddings

To enable semantic search, create vector embeddings for all indexed documents:

```bash
qmd embed
```

This processes all documents into 900-token chunks (with 15% overlap) and generates vector embeddings. Re-index if documents change:

```bash
qmd embed -f
```

The `-f` flag forces re-embedding even if vectors already exist.

## Index Management

### Check Index Status

View overall index statistics and collection details:

```bash
qmd status
```

Shows:
- Total documents indexed
- Number of vector embeddings
- Pending documents awaiting embedding
- Last update timestamp
- GPU/VRAM availability

### Update Collections

Re-index all collections (useful after file changes):

```bash
qmd update
```

Auto-pull from git before updating:

```bash
qmd update --pull
```

### Clean Up

Remove cache and orphaned data:

```bash
qmd cleanup
```

This vacuums the SQLite index database and removes stale content hashes.

## Context Management

Add descriptive context to help `qmd` understand collection purpose:

```bash
qmd context add [path] "description"
qmd context list
qmd context rm <path>
```

### Example

```bash
qmd context add plugins/archimedes/docs "Archimedes plugin: architecture intelligence, pattern matching, semantic search"
qmd context list
```

Context improves search relevance by providing semantic hints to the reranker.

## Using qmd in Archimedes (arch-docs Workflow)

The `arch-docs` workflow uses `qmd` to mine documentation for architectural patterns, decisions, and design context.

### Typical Workflow

1. **Index the documentation:**
   ```bash
   qmd collection add plugins/archimedes/docs --name archimedes-docs
   qmd embed  # Generate embeddings for semantic search
   ```

2. **Search for architectural context:**
   ```bash
   qmd query "error handling patterns" -c archimedes-docs --json > results.json
   ```

3. **Extract relevant sections:**
   ```bash
   qmd get "qmd://archimedes-docs/patterns/error-handling.md" -l 50
   ```

4. **Mine across multiple categories:**
   ```bash
   qmd multi-get "qmd://archimedes-docs/decisions/*.md" --json
   ```

### Integration with Archimedes Skills

The `extract-architecture` skill chain uses `qmd query` to:
- **Classify** documents by type (pattern, decision, design)
- **Explore** related architectural concepts
- **Extract** specific architectural elements
- **Trace** component dependencies via documentation references

Example skill usage:
```bash
# Extract architecture from documentation
qmd query "service interfaces" -c archimedes-docs --json | \
  jq '.[] | {file: .file, snippet: .snippet}'
```

## Advanced Options

### Custom Index Names

Use a custom index instead of the default:

```bash
qmd status --index custom-index
qmd query "topic" --index custom-index
```

This allows managing multiple indices for different projects.

### MCP Server Mode

Start `qmd` as a Model Context Protocol (MCP) server for integration with AI tools:

```bash
# Stdio transport (direct process)
qmd mcp

# HTTP transport (default port 8181)
qmd mcp --http

# HTTP with background daemon
qmd mcp --http --daemon

# Stop daemon
qmd mcp stop
```

The MCP server exposes `qmd` search capabilities to any MCP-compatible client (e.g., Claude).

## Common Patterns and Examples

### Search All Collections for a Pattern
```bash
qmd query "dependency injection" --all --min-score 0.7 --json
```

### Find Documents Matching Multiple Concepts
```bash
# Search for architectural patterns
qmd query "cache invalidation" -c archimedes-docs -n 20 --json > patterns.json

# Extract full document
jq -r '.[0].file' patterns.json | xargs qmd get
```

### Export Search Results
```bash
qmd search "API design" --csv > results.csv
qmd query "database indexing" --md > results.md
```

### Audit Index Health
```bash
qmd status  # Check pending embeddings
qmd update --pull  # Sync and re-index
qmd cleanup  # Remove orphaned data
```

## Troubleshooting

### "Documents need embeddings" Warning

When you see:
```
Tip: N documents need embeddings. Run 'qmd embed' to index them.
```

Run:
```bash
qmd embed
```

This creates vector embeddings for semantic search. Until embeddings exist, `vsearch` will not work effectively.

### No Results in Vector Search

If `qmd vsearch` returns empty results:
1. Ensure embeddings are generated: `qmd embed`
2. Try `qmd query` (with reranking) instead of `vsearch`
3. Check the score threshold: `qmd vsearch "term" --min-score 0.5`

### Large Index Performance

If searches are slow:
1. Filter to a specific collection: `qmd query "term" -c collection-name`
2. Limit results: `qmd query "term" -n 5`
3. Use `qmd search` (keyword-only) instead of `qmd query` (slower due to reranking)
4. Run `qmd cleanup` to vacuum the database

### Collection Not Updating

If changes to files aren't reflected:
```bash
qmd update                    # Re-index all
qmd update --pull             # Pull from git, then re-index
qmd collection remove <name> && qmd collection add <path> --name <name>  # Recreate
```

## Known Limitations

- **Chunk size:** Documents are split into 900-token chunks with 15% overlap for embedding. Very long documents may be split across multiple chunks.
- **File size limit in multi-get:** Default skip threshold is 10KB (`--max-bytes` flag can adjust)
- **No cross-collection search:** Filter `-c` restricts to one collection at a time; use multiple queries to search multiple collections
- **MCP daemon:** The HTTP daemon is stored in a system temp location and will not survive system reboot

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error (missing collection, invalid query, etc.) |
| 2 | Invalid arguments or flags |
| 127 | `qmd` command not found |

## Environment and Storage

- **Index location:** `~/.cache/qmd/index.sqlite` (default)
- **Models:** Downloaded automatically on first run:
  - Embedding: `ggml-org/embeddinggemma-300M-GGUF`
  - Reranking: `ggml-org/Qwen3-Reranker-0.6B-Q8_0-GGUF`
  - Query expansion: `tobil/qmd-query-expansion-1.7B-gguf`
- **GPU acceleration:** Uses Metal on macOS, CUDA on NVIDIA, CPU fallback

## References

- **qmd Repository:** See your system `qmd --version` for version information
- **Archimedes Integration:** Use `qmd` exclusively for the `arch-docs` workflow; there is no alternative (`rlmgrep` does not exist)
- **Related Tools:** Archimedes also includes `ast-grep` (pattern matching), `chunkhound` (code chunking), and `osgrep` (semantic search across code)
