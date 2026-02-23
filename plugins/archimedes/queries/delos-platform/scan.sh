#!/bin/bash
# semantic query pack scanner — delos-platform
# Usage: bash queries/delos-platform/scan.sh <repo-path> <session-id> <db-path>
set -e

REPO=$1; SESSION=$2; DB_PATH=$3
PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$(dirname "$PACK_DIR")")"

if [ -z "$REPO" ] || [ -z "$SESSION" ] || [ -z "$DB_PATH" ]; then
  echo '{"error":"Usage: scan.sh <repo> <session> <db-path>"}' >&2
  exit 1
fi

export PATH="$HOME/.local/bin:$PATH"

INDEX_DB="$REPO/.archimedes/index/chunkhound.db"

if [ ! -f "$INDEX_DB" ] || find "$REPO/.archimedes/index/" -name "chunkhound.db" -mtime +7 2>/dev/null | grep -q .; then
  mkdir -p "$REPO/.archimedes/index"
  echo "[arch-search] Building chunkhound index for $REPO..." >&2
  chunkhound index "$REPO" --db "$INDEX_DB" \
    --model text-embedding-3-small \
    --api-key "${OPENAI_API_KEY:-}"
fi

TAG_COUNT=0

for rule in "$PACK_DIR/rules"/*.yaml; do
  [ -f "$rule" ] || continue
  rule_name=$(basename "$rule" .yaml)

  query=$(yq '.query' "$rule")
  top_k=$(yq '.top_k' "$rule")

  written=$("$PLUGIN_ROOT/tools/chunkhound-search.py" \
    --query "$query" \
    --repo "$REPO" \
    --db "$INDEX_DB" \
    --top-k "$top_k" 2>/dev/null \
  | bun "$PLUGIN_ROOT/tools/tag-store.ts" write-from-chunkhound \
      --session "$SESSION" \
      --db "$DB_PATH" \
      --rule "$rule" \
      --target-repo "$REPO" \
  | jq -r '.written // 0')

  TAG_COUNT=$((TAG_COUNT + written))
  [ "$written" -gt 0 ] && echo "  [$rule_name] $written" >&2
done

echo "{\"ok\":true,\"pack\":\"$(basename $PACK_DIR)\",\"tags_written\":$TAG_COUNT}"
