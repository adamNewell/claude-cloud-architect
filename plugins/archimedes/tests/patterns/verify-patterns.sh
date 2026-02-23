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
echo "=== AWS Serverless Pack ==="
check "$PLUGIN_ROOT/patterns/aws-serverless/rules/lambda-handler-esm.yaml" \
  "$FIXTURES/sample-lambda.ts" 1 "AWS: Lambda ESM handler"
check "$PLUGIN_ROOT/patterns/aws-serverless/rules/lambda-handler-cjs.yaml" \
  "$FIXTURES/sample-lambda.cjs" 1 "AWS: Lambda CJS handler"
check "$PLUGIN_ROOT/patterns/aws-serverless/rules/dynamodb-v3.yaml" \
  "$FIXTURES/sample-aws-services.ts" 1 "AWS: DynamoDB v3 client"
check "$PLUGIN_ROOT/patterns/aws-serverless/rules/dynamodb-scan-antipattern.yaml" \
  "$FIXTURES/sample-aws-services.ts" 1 "AWS: DynamoDB Scan anti-pattern"
check "$PLUGIN_ROOT/patterns/aws-serverless/rules/sqs-producer.yaml" \
  "$FIXTURES/sample-aws-services.ts" 1 "AWS: SQS SendMessage"
check "$PLUGIN_ROOT/patterns/aws-serverless/rules/sns-publish.yaml" \
  "$FIXTURES/sample-aws-services.ts" 1 "AWS: SNS Publish"
check "$PLUGIN_ROOT/patterns/aws-serverless/rules/eventbridge-put.yaml" \
  "$FIXTURES/sample-aws-services.ts" 1 "AWS: EventBridge PutEvents"
check "$PLUGIN_ROOT/patterns/aws-serverless/rules/step-functions-invoke.yaml" \
  "$FIXTURES/sample-aws-services.ts" 1 "AWS: SFN StartExecution"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
