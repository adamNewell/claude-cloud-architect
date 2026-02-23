#!/bin/bash
# Deterministic scan for the aws-serverless pattern pack.
# Usage: bash patterns/aws-serverless/scan.sh <repo-path> <session-id> <db-path>
set -e

REPO=$1; SESSION=$2; DB_PATH=$3
PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$(dirname "$PACK_DIR")")"

if [ -z "$REPO" ] || [ -z "$SESSION" ] || [ -z "$DB_PATH" ]; then
  echo '{"error":"Usage: scan.sh <repo> <session> <db-path>"}' >&2
  exit 1
fi

TAG_COUNT=0

for rule in "$PACK_DIR/rules"/*.yaml; do
  [ -f "$rule" ] || continue
  rule_name=$(basename "$rule" .yaml)

  # Strip archimedes: field so ast-grep doesn't complain about unknown keys
  tmp_rule=$(mktemp /tmp/arch-rule-XXXXXX.yaml)
  yq 'del(.archimedes)' "$rule" > "$tmp_rule"

  written=$(ast-grep scan --rule "$tmp_rule" --json "$REPO" 2>/dev/null \
    | bun "$PLUGIN_ROOT/tools/tag-store.ts" write-from-ast-grep \
        --session "$SESSION" \
        --db "$DB_PATH" \
        --rule "$rule" \
        --source-tool "ast-grep" \
        --target-repo "$REPO" \
    | jq -r '.written // 0')

  rm -f "$tmp_rule"
  TAG_COUNT=$((TAG_COUNT + written))
  [ "$written" -gt 0 ] && echo "  [$rule_name] $written tags" >&2
done

echo "{\"ok\":true,\"pack\":\"aws-serverless\",\"tags_written\":$TAG_COUNT}"
