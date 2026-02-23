#!/Users/adamnewell/.local/share/uv/tools/chunkhound/bin/python3
"""
chunkhound-search.py -- JSON output wrapper for chunkhound semantic search.

Used by arch-search scan.sh scripts instead of the chunkhound CLI (which only
outputs human-readable text). Outputs a JSON array to stdout.

The shebang uses the chunkhound uv venv Python so all chunkhound deps are
available without any PYTHONPATH manipulation.

Usage:
  ./chunkhound-search.py --query "text" --repo /path/to/repo --db /path/to/chunks.db --top-k 5

Arguments:
  --query   Search query string (required)
  --repo    Repository root path for path normalization (required)
  --db      Path to chunkhound .db file (required)
  --top-k   Maximum number of results to return (default: 5)

Output (stdout):
  JSON array of result objects with fields:
    file_path   (str)   absolute path to the source file
    content     (str)   matched code/text snippet
    similarity  (float) cosine similarity score 0.0-1.0
    start_line  (int|null)
    end_line    (int|null)
    symbol      (str|null)
    chunk_type  (str|null)

Exit codes:
  0  success (including missing-index case, returns [])
  1  fatal error (bad args, import failure, embedding API failure)
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path


def build_config(db_path: Path, repo_path: Path):
    """Build a minimal chunkhound Config for search-only use.

    Reads embedding credentials from environment variables using the same
    precedence as the CLI: CHUNKHOUND_EMBEDDING__API_KEY,
    CHUNKHOUND_EMBEDDING__BASE_URL, CHUNKHOUND_EMBEDDING__MODEL,
    CHUNKHOUND_EMBEDDING__PROVIDER.

    Falls back gracefully: if no API key is present the EmbeddingConfig
    is set to None so create_services() still works -- search_semantic_impl
    will raise a clear error later when it validates providers.
    """
    from chunkhound.core.config.config import Config
    from chunkhound.core.config.database_config import DatabaseConfig
    from chunkhound.core.config.embedding_config import EmbeddingConfig

    db_cfg = DatabaseConfig(path=db_path, provider="duckdb")

    # Build embedding config from env vars if an API key is present.
    api_key = (
        os.environ.get("CHUNKHOUND_EMBEDDING__API_KEY")
        or os.environ.get("OPENAI_API_KEY")
    )
    emb_cfg = None
    if api_key:
        emb_kwargs = {"api_key": api_key}
        if v := os.environ.get("CHUNKHOUND_EMBEDDING__BASE_URL"):
            emb_kwargs["base_url"] = v
        if v := os.environ.get("CHUNKHOUND_EMBEDDING__PROVIDER"):
            emb_kwargs["provider"] = v
        if v := os.environ.get("CHUNKHOUND_EMBEDDING__MODEL"):
            emb_kwargs["model"] = v
        emb_cfg = EmbeddingConfig(**emb_kwargs)

    cfg = Config(database=db_cfg, embedding=emb_cfg, target_dir=repo_path)
    return cfg


async def run_search(query: str, repo: Path, db: Path, top_k: int) -> list:
    """Execute semantic search and return list of result dicts."""
    # Suppress chunkhound's verbose DEBUG/INFO logging so stdout stays clean JSON.
    # WARNING and above are still emitted to stderr so real errors are visible.
    try:
        from loguru import logger as _loguru_logger
        import sys as _sys
        _loguru_logger.remove()
        _loguru_logger.add(_sys.stderr, level="WARNING")
    except Exception:
        pass  # If loguru isn't present we just proceed with default logging.

    from chunkhound.core.config.embedding_factory import EmbeddingProviderFactory
    from chunkhound.database_factory import create_services
    from chunkhound.embeddings import EmbeddingManager
    from chunkhound.mcp_server.tools import search_semantic_impl
    from chunkhound.registry import configure_registry

    config = build_config(db_path=db, repo_path=repo)

    # Register the config with the global registry (mirrors search_command pattern).
    configure_registry(config)

    # Set up embedding manager (required by search_semantic_impl).
    embedding_manager = EmbeddingManager()
    if config.embedding:
        try:
            provider = EmbeddingProviderFactory.create_provider(config.embedding)
            embedding_manager.register_provider(provider, set_default=True)
        except Exception as exc:
            # Non-fatal: search will fail later with a clear message if the
            # provider is truly needed.
            print(
                json.dumps({"warning": f"Embedding provider setup skipped: {exc}"}),
                file=sys.stderr,
            )

    # Create services (opens the DuckDB connection).
    services = create_services(
        db_path=db,
        config=config,
        embedding_manager=embedding_manager,
    )

    # Execute semantic search via the shared MCP implementation.
    response = await search_semantic_impl(
        services=services,
        embedding_manager=embedding_manager,
        query=query,
        page_size=top_k,
        offset=0,
    )

    return response.get("results", [])


def normalize_results(raw: list) -> list:
    """Normalize raw result dicts to the canonical output schema."""
    output = []
    for r in raw:
        output.append({
            "file_path": r.get("file_path") or r.get("file") or "",
            "content": r.get("content") or r.get("text") or "",
            "similarity": r.get("similarity") or r.get("score") or 0.0,
            "start_line": r.get("start_line"),
            "end_line": r.get("end_line"),
            "symbol": r.get("symbol"),
            "chunk_type": r.get("chunk_type"),
        })
    return output


def main() -> int:
    parser = argparse.ArgumentParser(
        description="chunkhound semantic search -> JSON array on stdout"
    )
    parser.add_argument("--query", required=True, help="Search query text")
    parser.add_argument(
        "--repo",
        required=True,
        help="Repository root path (used for path normalization)",
    )
    parser.add_argument(
        "--db", required=True, help="Path to chunkhound .db index file"
    )
    parser.add_argument(
        "--top-k", type=int, default=5, help="Maximum results to return (default: 5)"
    )
    args = parser.parse_args()

    db_path = Path(args.db)
    repo_path = Path(args.repo)

    # Graceful exit when index is absent -- scan.sh should continue.
    if not db_path.exists():
        print(
            json.dumps(
                {"info": f"Index not found: {db_path}  (run chunkhound index first)"}
            ),
            file=sys.stderr,
        )
        print("[]")
        return 0

    try:
        raw = asyncio.run(
            run_search(
                query=args.query,
                repo=repo_path,
                db=db_path,
                top_k=args.top_k,
            )
        )
        output = normalize_results(raw)
        print(json.dumps(output))
        return 0

    except Exception as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        # Still emit an empty array so callers that check stdout get valid JSON.
        print("[]")
        return 1


if __name__ == "__main__":
    sys.exit(main())
