#!/bin/bash
# Semantic scan orchestrator for Archimedes Tier 2.
# Mirrors tools/scripts/run-structure-scan.sh interface exactly.
#
# Usage: bash tools/run-semantic-scan.sh <repo> <session> <db-path> [packs]
#
# Arguments (positional, order-sensitive):
#   repo      — Absolute path to service root (not monorepo root)
#   session   — Session ID (must match an initialized session)
#   db-path   — Absolute path to tags.db
#   packs     — Comma-separated: "core,aws-serverless,delos-platform,iot-core"
#
# Gate: produces ≥10 CANDIDATE tags on wellcube-device-data-processing
set -e

REPO=$1; SESSION=$2; DB_PATH=$3
PACKS=${4:-"core"}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"

# Ensure chunkhound is findable
export PATH="$HOME/.local/bin:$PATH"

echo "{\"scan_start\":true,\"repo\":\"$REPO\",\"packs\":\"$PACKS\",\"tier\":\"semantic\"}" >&2

for pack in $(echo "$PACKS" | tr ',' '\n'); do
  SCAN_SH="$PLUGIN_ROOT/queries/$pack/scan.sh"
  if [ -f "$SCAN_SH" ]; then
    echo "Running semantic pack: $pack" >&2
    bash "$SCAN_SH" "$REPO" "$SESSION" "$DB_PATH"
  else
    echo "{\"warning\":\"Semantic pack '$pack' not found at $SCAN_SH\"}" >&2
  fi
done

echo "{\"ok\":true,\"repo\":\"$REPO\",\"session\":\"$SESSION\",\"tier\":\"semantic\"}"
