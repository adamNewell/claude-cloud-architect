#!/bin/bash
# Top-level deterministic structure scan orchestrator.
# Runs enabled pattern packs against a repo and writes to tag store.
# Usage: bash tools/scripts/run-structure-scan.sh <repo> <session> <db-path> [packs]
set -e

REPO=$1; SESSION=$2; DB_PATH=$3
PACKS=${4:-"core"}  # comma-separated: "core,aws-serverless,iot-core"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"

echo "{\"scan_start\":true,\"repo\":\"$REPO\",\"packs\":\"$PACKS\"}" >&2

for pack in $(echo "$PACKS" | tr ',' '\n'); do
  SCAN_SH="$PLUGIN_ROOT/patterns/$pack/scan.sh"
  if [ -f "$SCAN_SH" ]; then
    echo "Running pack: $pack" >&2
    bash "$SCAN_SH" "$REPO" "$SESSION" "$DB_PATH"
  else
    echo "{\"warning\":\"Pack '$pack' not found at $SCAN_SH\"}" >&2
  fi
done

echo "{\"ok\":true,\"repo\":\"$REPO\",\"session\":\"$SESSION\"}"
