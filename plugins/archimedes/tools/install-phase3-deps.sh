#!/bin/bash
# install-phase3-deps.sh — One-shot installer for Archimedes Phase 3 tools
# Idempotent: safe to re-run. Exits non-zero if any required install fails.
set -e

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[phase3-deps] Checking Phase 3 tool dependencies..."

# ── osgrep ───────────────────────────────────────────────────────────────────
if command -v osgrep &>/dev/null; then
  echo "[phase3-deps] ✅ osgrep already installed: $(osgrep --version 2>/dev/null || echo 'unknown version')"
else
  echo "[phase3-deps] Installing osgrep..."
  npm install -g osgrep
  echo "[phase3-deps] ✅ osgrep installed: $(osgrep --version 2>/dev/null)"
fi

# ── riviere ──────────────────────────────────────────────────────────────────
if command -v riviere &>/dev/null; then
  echo "[phase3-deps] ✅ riviere already installed: $(riviere --version 2>/dev/null)"
else
  echo "[phase3-deps] Installing riviere..."
  npm install -g riviere
  echo "[phase3-deps] ✅ riviere installed: $(riviere --version 2>/dev/null)"
fi

# ── qmd ──────────────────────────────────────────────────────────────────────
if command -v qmd &>/dev/null; then
  echo "[phase3-deps] ✅ qmd already installed: $(qmd --version 2>/dev/null || echo 'installed')"
else
  echo "[phase3-deps] qmd not found. Install via: pip install qmd-cli or brew install qmd"
  echo "[phase3-deps] ⚠️  Install qmd manually and re-run this script."
  exit 1
fi

# ── colgrep ──────────────────────────────────────────────────────────────────
if command -v colgrep &>/dev/null; then
  echo "[phase3-deps] ✅ colgrep already installed: $(colgrep --version 2>/dev/null || echo 'installed')"
else
  echo "[phase3-deps] Installing colgrep..."
  npm install -g colgrep
  echo "[phase3-deps] ✅ colgrep installed"
fi

# ── Serena MCP ───────────────────────────────────────────────────────────────
if command -v uvx &>/dev/null; then
  echo "[phase3-deps] ✅ uvx available — Serena can be started with: uvx --from serena serena-mcp-server"
else
  echo "[phase3-deps] ❌ uvx not found. Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh"
  exit 1
fi

# ── Serena MCP config ─────────────────────────────────────────────────────────
SETTINGS="$HOME/.claude/settings.json"
if [ -f "$SETTINGS" ] && python3 -c "
import json, sys
d = json.load(open('$SETTINGS'))
sys.exit(0 if 'serena' in d.get('mcpServers', {}) else 1)
" 2>/dev/null; then
  echo "[phase3-deps] ✅ Serena MCP already configured in $SETTINGS"
else
  echo "[phase3-deps] Adding Serena MCP to $SETTINGS..."
  python3 << 'PYEOF'
import json, os

settings_path = os.path.expanduser("~/.claude/settings.json")
with open(settings_path) as f:
    settings = json.load(f)

settings.setdefault("mcpServers", {})["serena"] = {
    "command": "uvx",
    "args": ["--from", "serena", "serena-mcp-server"],
    "env": {}
}

with open(settings_path, "w") as f:
    json.dump(settings, f, indent=2)

print("[phase3-deps] ✅ Serena MCP configured")
PYEOF
fi

echo ""
echo "[phase3-deps] ✅ All Phase 3 dependencies installed."
echo "[phase3-deps]    Serena MCP: restart Claude Code to pick up new MCP config."
