#!/bin/bash
# check-phase3-tools.sh — SessionStart hook
# Checks for all required Phase 3 tooling at session start.
# Prints a warning to stdout if any tool is missing; always exits 0.
#
# Register in .claude/settings.json:
# "hooks": {
#   "SessionStart": [
#     { "hooks": [{ "type": "command", "command": "bash /path/to/check-phase3-tools.sh" }] }
#   ]
# }

MISSING=()

command -v osgrep   &>/dev/null || MISSING+=("osgrep   → npm install -g osgrep")
command -v riviere  &>/dev/null || MISSING+=("riviere  → npm install -g riviere")
command -v qmd      &>/dev/null || MISSING+=("qmd      → see qmd installation docs")
command -v colgrep  &>/dev/null || MISSING+=("colgrep  → npm install -g colgrep")
command -v uvx      &>/dev/null || MISSING+=("uvx      → curl -LsSf https://astral.sh/uv/install.sh | sh")

# Check Serena MCP configured (advisory only)
SETTINGS="$HOME/.claude/settings.json"
if [ -f "$SETTINGS" ]; then
  python3 -c "
import json, sys
d = json.load(open('$SETTINGS'))
sys.exit(0 if 'serena' in d.get('mcpServers', {}) else 1)
" 2>/dev/null || MISSING+=("serena   → run install-phase3-deps.sh to configure MCP")
fi

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "[archimedes] ⚠️  Phase 3 tools missing:"
  for tool in "${MISSING[@]}"; do
    echo "   • $tool"
  done
  echo "   Fix: bash plugins/archimedes/tools/install-phase3-deps.sh"
fi

exit 0
