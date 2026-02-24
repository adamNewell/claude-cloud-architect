# ColGREP CLI Reference

> Internal reference for arch-search and arch-map-service skills.
> **For running semantic search from the CLI**, load `skills/arch-search/SKILL.md` instead.

ColGREP is a multi-vector semantic code search engine that combines code embeddings with traditional text search for high-recall architectural discovery. Use it when structural patterns (ast-grep) would miss conceptually similar but syntactically different code.

## Installation

```bash
pip install colgrep        # Python package
cargo install colgrep     # from source (faster)
```

**Archimedes Note**: colgrep is installed via `install-phase3-deps.sh` during Phase 3 setup.

Verify installation:
```bash
colgrep --version
```

## Indexing

Index a repository before searching. Indexes are stored in `.archimedes/indices/{repo-slug}/colgrep/`.

```bash
# Index a repository
colgrep index --path /path/to/repo --output .archimedes/indices/my-service/colgrep/

# Index with specific file types only
colgrep index --path /path/to/repo --include "*.ts,*.tsx,*.js" --output .archimedes/indices/my-service/colgrep/

# Index with chunking (AST-aware, recommended for code)
colgrep index --path /path/to/repo --chunk-mode ast --output .archimedes/indices/my-service/colgrep/

# Reindex (update existing index)
colgrep index --path /path/to/repo --output .archimedes/indices/my-service/colgrep/ --incremental
```

### Index Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `--path <dir>` | required | Root directory to index |
| `--output <dir>` | required | Where to store the index |
| `--include <glob>` | `*.*` | File patterns to include |
| `--exclude <glob>` | `.git,node_modules` | Patterns to exclude |
| `--chunk-mode ast\|line\|paragraph` | `ast` | How to split code into chunks |
| `--chunk-size <n>` | `512` | Max tokens per chunk |
| `--incremental` | false | Only index changed files |
| `--model <name>` | system default | Embedding model |

## Searching

```bash
# Basic semantic search
colgrep search --index .archimedes/indices/my-service/colgrep/ --query "order processing logic" --top-k 20

# Search with JSON output (use for agent consumption)
colgrep search --index .archimedes/indices/my-service/colgrep/ --query "payment gateway integration" --top-k 10 --json

# Hybrid search (semantic + keyword)
colgrep search --index .archimedes/indices/my-service/colgrep/ --query "redis cache" --mode hybrid --top-k 15 --json

# Filter by file pattern
colgrep search --index .archimedes/indices/my-service/colgrep/ --query "authentication middleware" --include "*.ts" --top-k 10 --json
```

### Search Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `--index <dir>` | required | Path to colgrep index |
| `--query <text>` | required | Natural language or code query |
| `--top-k <n>` | 10 | Number of results to return |
| `--json` | false | Output as JSON array |
| `--mode semantic\|keyword\|hybrid` | `hybrid` | Search mode |
| `--include <glob>` | all | Filter results by file pattern |
| `--min-score <n>` | 0.0 | Minimum similarity score (0.0-1.0) |
| `--context <n>` | 3 | Lines of context around each result |

## JSON Output Format

```json
[
  {
    "file": "src/orders/order.service.ts",
    "score": 0.87,
    "chunk_id": "src/orders/order.service.ts:45-89",
    "excerpt": "async processOrder(orderId: string): Promise<Order> {\n  const order = await this.orderRepo.findById(orderId);\n  // ...\n}",
    "start_line": 45,
    "end_line": 89,
    "symbols": ["processOrder", "OrderService"]
  },
  {
    "file": "src/payments/payment.service.ts",
    "score": 0.72,
    "chunk_id": "src/payments/payment.service.ts:12-34",
    "excerpt": "async chargeOrder(order: Order, amount: number): Promise<Payment> {",
    "start_line": 12,
    "end_line": 34,
    "symbols": ["chargeOrder", "PaymentService"]
  }
]
```

## Archimedes Usage

ColGREP produces DEPENDENCY and CAPABILITY tags in arch-search and arch-map-service skills. Always use `--json` flag and `--top-k 20` unless searching for something very specific.

```bash
# Find components related to a specific capability
colgrep search \
  --index .archimedes/indices/${REPO_SLUG}/colgrep/ \
  --query "payment processing and refunds" \
  --top-k 20 \
  --json \
  --mode hybrid

# Cross-repo capability discovery (run per repo, collect results)
for REPO in "${REPOS[@]}"; do
  SLUG=$(basename "$REPO" | tr '[:upper:]' '[:lower:]')
  colgrep search \
    --index ".archimedes/indices/${SLUG}/colgrep/" \
    --query "$QUERY" \
    --top-k 10 \
    --json
done
```

**Tag Confidence**: 0.50 (semantic similarity -- always MACHINE weight, CANDIDATE status)

## Index Location Convention

```
.archimedes/
  indices/
    {repo-slug}/
      colgrep/
        index.bin        <- Vector index
        metadata.json    <- File manifest
        chunks.jsonl     <- Chunk registry
```

## Performance Notes

- Initial indexing: ~1 min per 50k LOC (depends on embedding model)
- Incremental reindex: ~10s per 1000 changed lines
- Search latency: ~200ms for top-20 results on indexed repo
- Index size: ~2x source code size
- Concurrent searches: safe (read-only after indexing)
