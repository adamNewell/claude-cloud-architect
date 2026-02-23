#!/bin/bash
# Smoke test: verify patterns match expected fixtures
set -e

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FIXTURES="$PLUGIN_ROOT/tests/patterns/fixtures"
PASS=0; FAIL=0

check() {
  local rule="$1"; local fixture="$2"; local min="$3"; local label="$4"
  local tmp=$(mktemp /tmp/arch-XXXXXX.yaml)
  yq 'del(.archimedes)' "$rule" > "$tmp"
  local count=$(ast-grep scan --rule "$tmp" "$fixture" --json 2>/dev/null | jq 'length')
  rm -f "$tmp"
  if [ "${count:-0}" -ge "$min" ]; then
    echo "✅ $label ($count matches)"; PASS=$((PASS+1))
  else
    echo "❌ $label (expected >=$min, got ${count:-0})"; FAIL=$((FAIL+1))
  fi
}

echo "=== Core Pack ==="
check "$PLUGIN_ROOT/patterns/core/rules/http-route-express.yaml" \
  "$FIXTURES/sample-express.ts" 2 "Core: Express route handlers"
check "$PLUGIN_ROOT/patterns/core/rules/http-route-fastapi.yaml" \
  "$FIXTURES/sample-fastapi.py" 2 "Core: FastAPI route handlers"
check "$PLUGIN_ROOT/patterns/core/rules/http-client-ts.yaml" \
  "$FIXTURES/sample-express.ts" 1 "Core: axios HTTP client"
check "$PLUGIN_ROOT/patterns/core/rules/event-emit-ts.yaml" \
  "$FIXTURES/sample-express.ts" 1 "Core: EventEmitter emit"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
