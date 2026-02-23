# chunkhound CLI Reference

> Internal reference for arch-search scan.sh scripts.
> **DO NOT load this file** unless you are authoring new query pack scan.sh scripts.
> Load `skills/arch-search/SKILL.md` instead for running scans.

## Installation

Binary: `~/.local/bin/chunkhound` (also `code-chunkhound`)
Version: chunkhound 4.0.1
Verify: `chunkhound --version`

If `chunkhound: command not found`:
```bash
export PATH="$HOME/.local/bin:$PATH"
```

## Index Command

Builds a DuckDB vector embedding index for a repository.

```bash
chunkhound index <repo_path> --db <index_db_path>
```

Example:
```bash
chunkhound index /path/to/repo \
  --db /path/to/repo/.archimedes/index/chunkhound.db
```

- Default model: `text-embedding-3-small`
- Requires `OPENAI_API_KEY` env var (or `--api-key`)
- Idempotent: re-run updates changed files (mtimes tracked)
- DB format: DuckDB (not SQLite)
- Index convention: `$REPO/.archimedes/index/chunkhound.db`

### Embedding Provider Requirement

The `--api-key` flag alone is **not sufficient** to configure the embedding provider. You must also supply a `.chunkhound.json` config file in the working directory or use `--model` explicitly:

```bash
# Option A: config file (recommended for scripts)
cat > /path/to/repo/.chunkhound.json << 'EOF'
{
  "embeddings": {
    "provider": "openai",
    "model": "text-embedding-3-small",
    "api_key_env": "OPENAI_API_KEY"
  }
}
EOF
chunkhound index /path/to/repo --db /path/to/repo/.archimedes/index/chunkhound.db

# Option B: explicit flags
chunkhound index /path/to/repo \
  --db /path/to/repo/.archimedes/index/chunkhound.db \
  --model text-embedding-3-small \
  --api-key "$OPENAI_API_KEY"
```

Without embedding configuration, `chunkhound index` exits with: `Error: No embedding provider configured`

## Search Command

Runs a semantic similarity query against the index.

```bash
chunkhound search "<query>" <repo_path> \
  --db <index_db_path> \
  --semantic \
  --page-size <N>
```

Example:
```bash
chunkhound search "MongoDB database client connection" /path/to/repo \
  --db /path/to/repo/.archimedes/index/chunkhound.db \
  --semantic \
  --page-size 5
```

### Output Format

The CLI emits **human-readable text** to stdout, not JSON. There is no `--json` flag for the search command.

Example output:
```
=== Semantic Search Results ===

[INFO] Query: 'MongoDB database client connection'
[INFO] Results: 1 of 1 (showing 1-1)

[1] src/db/client.ts
[INFO] Similarity: 0.501
[INFO] Lines 6-21
```
(code block of matched content)
```

Each result corresponds to one code chunk in the index. The text fields that appear per result are:

| Display Label | Internal Field | Type | Description |
|---------------|---------------|------|-------------|
| (file path after `[N]`) | `file_path` | string | Absolute file path (full path, not relative) |
| `Similarity:` | `similarity` | number | Cosine similarity (0–1), higher = better match |
| `Score:` | `score` | number | Alternative score field (used in some code paths) |
| `Lines N-M` | `start_line` / `end_line` | integer | Line range of the chunk |
| (code block) | `content` | string | Matching code chunk text |
| (internal only) | `symbol` | string | Function/class name for the chunk |
| (internal only) | `chunk_type` | string | Construct type: `function`, `class`, `method`, etc. |

> **Verified field names**: `file_path`, `content`, `similarity`, `score`, `start_line`, `end_line`, `symbol`, `chunk_type` — confirmed from chunkhound 4.0.1 source (`duckdb_provider.py` `_executor_search_semantic`) on 2026-02-23.
>
> **CRITICAL for scan.sh parsing**: The CLI output is text, not JSON. To consume results programmatically from scan.sh, either:
> 1. Parse the text output with `awk`/`grep` (fragile), or
> 2. Use the chunkhound MCP server interface which returns structured JSON with these same field names

### Stale Index Detection

```bash
# Index missing
[ ! -f "$REPO/.archimedes/index/chunkhound.db" ] && echo "needs_build"

# Index older than 7 days
find "$REPO/.archimedes/index/" -name "chunkhound.db" -mtime +7 | grep -q . && echo "stale"
```

## Common Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Index not found, query failed, or missing API key / embedding config |
| 127 | chunkhound not in PATH — add `~/.local/bin` |

## Environment Variables

- `OPENAI_API_KEY` — required for embedding generation (index + first-time search)
- `PATH` — must include `~/.local/bin`

## Known Issues (4.0.1)

- `--api-key` alone does not activate the embedding provider; a `.chunkhound.json` config or `--model` flag is also required
- Embedding batch errors (`_Task object has no attribute 'elapsed'`) can occur on first index run; re-running the index command usually resolves them
- `chunkhound index` with only a single-line file may produce 0 chunks; use files with multiple functions/blocks
