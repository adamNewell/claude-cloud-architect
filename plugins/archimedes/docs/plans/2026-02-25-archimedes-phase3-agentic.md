# Archimedes Phase 3: Agentic Layer Implementation Plan

> **For Claude:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Tier 3 agentic intelligence layer — osgrep role classification, Serena LSP symbol navigation, Rivière cross-repo flow synthesis, and qmd documentation mining — producing ROLE, FLOW, and DEBT tags that complement the PATTERN and CANDIDATE tags from Phases 1 and 2.

**Architecture:** Three new atomic skills (arch-observe, arch-navigate, arch-flows) plus one doc-mining skill (arch-docs) are adopted from marketplace stubs and validated to ≥115/120 via skill-judge. Two workflow skills (arch-trace-flow, arch-assess-debt) are written from scratch. All skills write to the same session tag store as Phases 1 and 2. A `SessionStart` hook checks for required Phase 3 tooling at every session start.

**Tech Stack:** osgrep v0.5.16 (npm, role classification + call chains), Serena MCP (uvx, LSP symbol navigation), Rivière CLI v0.8.9 (flow synthesis), qmd v1.0.7 (doc search), Bun + TypeScript (tools), bash (install + hook scripts), SQLite (tag store)

**Tool Reality Check (verified 2026-02-25):**
- ✅ `riviere` v0.8.9 — installed
- ✅ `qmd` v1.0.7 — installed
- ✅ `uvx` v0.8.22 — installed (used to run Serena)
- ⬇️ `osgrep` v0.5.16 — real npm package, not yet installed (`npm install -g osgrep`)
- ⬇️ `Serena MCP` — installable via `uvx --from serena serena-mcp-server`, needs MCP config
- ❌ `rlmgrep` — does not exist on npm or pip; arch-docs uses qmd-only
- ⬇️ `colgrep` — not yet installed; cookbook and skill written regardless (install in Task 1)

**Marketplace stubs available at:** `~/.claude/plugins/cache/claude-cloud-architect/archimedes/0.2.0/`
- Skills: arch-observe, arch-navigate, arch-flows, arch-docs
- Agents: observe-agent, navigate-agent, flow-agent, docs-agent
- Cookbooks: osgrep/cli.md, serena/cli.md

---

## Phase Overview

| Phase | Gate |
|-------|------|
| 1 ✅ | ast-grep patterns → 65 HUMAN tags on wellcube-device-data-processing |
| 2 ✅ | chunkhound semantic → 98 CANDIDATE tags (26 subkinds) on wellcube-device-data-processing |
| 3 (this plan) | `arch-trace-flow` produces valid Rivière schema for ≥1 operation flow in Delos |

---

## File Map

```
plugins/archimedes/
├── tools/
│   └── install-phase3-deps.sh          CREATE: one-shot install script for Phase 3 tools
├── hooks/
│   └── check-phase3-tools.sh           CREATE: UserPromptSubmit hook for tool presence check
├── cookbook/
│   ├── osgrep/
│   │   └── cli.md                      CREATE: adopted from marketplace stub
│   ├── serena/
│   │   └── cli.md                      CREATE: adopted from marketplace stub
│   ├── qmd/
│   │   └── cli.md                      CREATE: written from scratch (qmd is installed)
│   └── colgrep/
│       └── cli.md                      CREATE: written from scratch (install via install-phase3-deps.sh)
├── skills/
│   ├── arch-observe/
│   │   └── SKILL.md                    CREATE: adopted + skill-judge validated
│   ├── arch-navigate/
│   │   └── SKILL.md                    CREATE: adopted + skill-judge validated
│   ├── arch-docs/
│   │   └── SKILL.md                    CREATE: adopted + adapted (qmd-only, no rlmgrep)
│   ├── arch-flows/
│   │   └── SKILL.md                    CREATE: adopted + skill-judge validated
│   ├── arch-trace-flow/
│   │   └── SKILL.md                    CREATE: new workflow (navigate → observe → flows)
│   └── arch-assess-debt/
│       └── SKILL.md                    CREATE: new workflow (structure → observe → docs)
└── agents/
    ├── observe-agent.md                CREATE: adopted from marketplace stub
    ├── navigate-agent.md               CREATE: adopted from marketplace stub
    ├── flow-agent.md                   CREATE: adopted from marketplace stub
    └── docs-agent.md                   CREATE: adopted from marketplace stub
```

---

## Chunk 1: Foundation — Install + Guard

### Task 1: Dependency Install Script

**Files:**
- Create: `tools/install-phase3-deps.sh`

This script installs all Phase 3 tools that aren't already present and configures Serena MCP. Running it again is safe (idempotent checks).

- [ ] **Step 1: Write install-phase3-deps.sh**

```bash
cat > plugins/archimedes/tools/install-phase3-deps.sh << 'SCRIPT'
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
SCRIPT
chmod +x plugins/archimedes/tools/install-phase3-deps.sh
```

- [ ] **Step 2: Run the install script**

```bash
bash plugins/archimedes/tools/install-phase3-deps.sh
```

Expected output: `✅ All Phase 3 dependencies installed.`

- [ ] **Step 3: Verify all tools are available**

```bash
osgrep --version
riviere --version
qmd --version
uvx --version
```

Expected: All four print version strings without error.

- [ ] **Step 4: Commit**

```bash
git add plugins/archimedes/tools/install-phase3-deps.sh
git commit -m "feat(archimedes): add install-phase3-deps.sh for osgrep, riviere, qmd, serena"
```

---

### Task 2: SessionStart Tool Guard Hook

**Files:**
- Create: `hooks/check-phase3-tools.sh`

A `SessionStart` hook that runs at the beginning of every Claude Code session and warns if any Phase 3 tools are missing. Fires unconditionally on session start — not gated on a skill name or prompt content. Does NOT block execution (always exits 0).

- [ ] **Step 1: Write check-phase3-tools.sh**

```bash
mkdir -p plugins/archimedes/hooks
cat > plugins/archimedes/hooks/check-phase3-tools.sh << 'SCRIPT'
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
SCRIPT
chmod +x plugins/archimedes/hooks/check-phase3-tools.sh
```

- [ ] **Step 2: Register the hook in the project .claude/settings.json**

Read current settings, then add under `hooks.SessionStart`:

```bash
cat .claude/settings.json 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d.get('hooks',{}), indent=2))" 2>/dev/null || echo "no hooks yet"
```

Add to `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash /Users/adamnewell/code/personal/github/adamNewell/claude-cloud-architect/plugins/archimedes/hooks/check-phase3-tools.sh"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 3: Verify the hook works**

```bash
bash plugins/archimedes/hooks/check-phase3-tools.sh
echo "Exit code: $?"
```

Expected: Exit code 0 always. If tools are missing, prints warning lines to stdout before exiting.

- [ ] **Step 4: Commit**

```bash
git add plugins/archimedes/hooks/check-phase3-tools.sh
git add .claude/settings.json
git commit -m "feat(archimedes): add SessionStart hook to warn on missing Phase 3 tools"
```

---

## Chunk 2: Cookbooks

### Task 3: osgrep CLI Cookbook

**Files:**
- Create: `cookbook/osgrep/cli.md`
- Source: `~/.claude/plugins/cache/claude-cloud-architect/archimedes/0.2.0/cookbook/osgrep/cli.md`

The marketplace has a complete osgrep cookbook. Adopt it, verify commands against the installed binary, and add any corrections.

- [ ] **Step 1: Read the marketplace stub**

```bash
cat ~/.claude/plugins/cache/claude-cloud-architect/archimedes/0.2.0/cookbook/osgrep/cli.md
```

- [ ] **Step 2: Verify key commands against installed osgrep**

```bash
# Verify classify command exists
osgrep classify --help 2>&1 | head -20

# Verify trace command exists
osgrep trace --help 2>&1 | head -20

# Quick smoke test on a real file
osgrep classify --file plugins/archimedes/tools/tag-store.ts --json 2>/dev/null | head -20
```

Expected: JSON output with `role`, `confidence`, and `call_chain` fields.

- [ ] **Step 3: Write cookbook/osgrep/cli.md**

Copy the marketplace stub, applying corrections from Step 2. Add:
- Verified version: `osgrep vX.X.X` (from `osgrep --version`)
- Corrections to any commands that don't match actual CLI flags
- Known issues observed during Step 2

```bash
mkdir -p plugins/archimedes/cookbook/osgrep
# Write the file using Read and Write tools after verifying in Step 2
```

- [ ] **Step 4: Commit**

```bash
git add plugins/archimedes/cookbook/osgrep/cli.md
git commit -m "docs(archimedes): add osgrep CLI cookbook"
```

---

### Task 4: Serena LSP Cookbook

**Files:**
- Create: `cookbook/serena/cli.md`
- Source: `~/.claude/plugins/cache/claude-cloud-architect/archimedes/0.2.0/cookbook/serena/cli.md`

- [ ] **Step 1: Read the marketplace stub**

```bash
cat ~/.claude/plugins/cache/claude-cloud-architect/archimedes/0.2.0/cookbook/serena/cli.md
```

- [ ] **Step 2: Verify Serena MCP is configured and reachable**

After restarting Claude Code (required for new MCP config to load), verify:

```bash
# Check MCP settings include serena
cat ~/.claude/settings.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('serena' in d.get('mcpServers',{}))"
```

Expected: `True`

Note: Actual MCP tool verification (`find_symbol`, etc.) requires Claude Code to be restarted with the new config. Document this in the cookbook.

- [ ] **Step 3: Write cookbook/serena/cli.md**

Copy marketplace stub. Add:
- Installation note: `uvx --from serena serena-mcp-server` (no separate install needed)
- MCP config block (exact JSON for `.claude/settings.json`)
- Note that MCP tools are invoked via Claude Code's tool-use interface, not CLI
- Restart requirement after config change

```bash
mkdir -p plugins/archimedes/cookbook/serena
```

- [ ] **Step 4: Commit**

```bash
git add plugins/archimedes/cookbook/serena/cli.md
git commit -m "docs(archimedes): add Serena LSP MCP cookbook"
```

---

### Task 5: qmd CLI Cookbook

**Files:**
- Create: `cookbook/qmd/cli.md`

No marketplace stub — write from scratch based on `qmd --help` output (already verified installed).

- [ ] **Step 1: Explore qmd commands**

```bash
qmd --help 2>&1
qmd query --help 2>&1
qmd search --help 2>&1
qmd collection --help 2>&1 || qmd collection add --help 2>&1
```

- [ ] **Step 2: Run a smoke test on a real documentation directory**

```bash
# Test: index the archimedes docs directory
mkdir -p /tmp/qmd-test
qmd collection add plugins/archimedes/docs --name arch-test 2>&1 | head -10
qmd query "architectural decision" 2>&1 | head -20
# Cleanup
qmd collection remove arch-test 2>/dev/null || true
```

- [ ] **Step 3: Write cookbook/qmd/cli.md**

Structure:
```
## Installation
Binary: qmd (version X.X.X)

## Indexing a Documentation Collection
## Searching
## JSON Output Mode
## Using qmd in Archimedes (arch-docs workflow)
## Common Exit Codes
## Known Issues
```

Include exact commands with expected output for each section. Note that `rlmgrep` does not exist — qmd is the sole doc search tool in Archimedes.

```bash
mkdir -p plugins/archimedes/cookbook/qmd
```

- [ ] **Step 4: Commit**

```bash
git add plugins/archimedes/cookbook/qmd/cli.md
git commit -m "docs(archimedes): add qmd CLI cookbook for arch-docs documentation mining"
```

---

### Task 5b: colgrep CLI Cookbook

**Files:**
- Create: `cookbook/colgrep/cli.md`

colgrep was planned in the v1 spec but not yet installed. Write the cookbook now — installation is handled by `install-phase3-deps.sh`. The cookbook is written from scratch based on the colgrep API contract.

- [ ] **Step 1: Research colgrep CLI interface**

```bash
# After install-phase3-deps.sh installs colgrep:
colgrep --help 2>&1
colgrep index --help 2>&1
colgrep search --help 2>&1
```

- [ ] **Step 2: Run a smoke test**

```bash
# Index a directory
colgrep index /path/to/repo --output /tmp/colgrep-test.db

# Search
colgrep search "database client connection" --index /tmp/colgrep-test.db --top-k 5
```

Note output format (JSON vs text) and verify field names.

- [ ] **Step 3: Write cookbook/colgrep/cli.md**

Structure:
```
## Installation
## Index Command
## Search Command
### Output Format
## Common Exit Codes
## Known Issues
```

Follow the same format as `cookbook/chunkhound/cli.md` (Phase 2 reference).

```bash
mkdir -p plugins/archimedes/cookbook/colgrep
```

- [ ] **Step 4: Commit**

```bash
git add plugins/archimedes/cookbook/colgrep/cli.md
git commit -m "docs(archimedes): add colgrep CLI cookbook"
```

---

## Chunk 3: Atomic Skills — Observe + Navigate

### Task 6: arch-observe SKILL.md

**Files:**
- Create: `skills/arch-observe/SKILL.md`
- Source: `~/.claude/plugins/cache/claude-cloud-architect/archimedes/0.2.0/skills/arch-observe/SKILL.md`

Target: ≥115/120 on skill-judge. Use iterative loop until gate passes.

- [ ] **Step 1: Read and adopt the marketplace stub**

```bash
cat ~/.claude/plugins/cache/claude-cloud-architect/archimedes/0.2.0/skills/arch-observe/SKILL.md
```

Review for:
- Osgrep commands that match the actual installed binary
- Daemon lifecycle (start/stop at skill invocation, not session-init)
- Tag schema alignment (ROLE tags, DEPENDENCY tags, confidence=0.70 MACHINE CANDIDATE)
- Reference to `cookbook/osgrep/cli.md` for supporting docs

- [ ] **Step 2: Write skills/arch-observe/SKILL.md**

```bash
mkdir -p plugins/archimedes/skills/arch-observe
```

Adapt the stub: verify every osgrep command against `osgrep --help`, correct any mismatches, ensure the tag-writing examples use `bun tools/tag-store.ts write` correctly.

- [ ] **Step 3: Run skill-judge — first pass**

```
Use skill-judge skill to evaluate plugins/archimedes/skills/arch-observe/SKILL.md
```

Record score and all feedback.

- [ ] **Step 4: Iterate until ≥115/120**

For each round of feedback:
- Fix specific issues flagged by skill-judge
- Re-run skill-judge
- Stop when score ≥115/120

Common issues to watch for:
- D1 (Knowledge Delta): Remove any osgrep basics Claude already knows; keep expert decision trees
- D3 (Anti-Patterns): Add NEVER list (e.g., never run classify on generated/vendor dirs, never treat 0.70 confidence as VALIDATED)
- D4 (Description): Ensure description has WHAT + WHEN + trigger keywords
- D8 (Usability): Include error handling for osgrep daemon failures

- [ ] **Step 5: Commit**

```bash
git add plugins/archimedes/skills/arch-observe/SKILL.md
git commit -m "feat(archimedes): add arch-observe skill (osgrep role classification, >=115/120 skill-judge)"
```

---

### Task 7: arch-navigate SKILL.md

**Files:**
- Create: `skills/arch-navigate/SKILL.md`
- Source: `~/.claude/plugins/cache/claude-cloud-architect/archimedes/0.2.0/skills/arch-navigate/SKILL.md`

Target: ≥115/120 on skill-judge. Serena uses MCP tools — the skill invokes them directly in Claude Code, not via CLI subprocess.

- [ ] **Step 1: Read the marketplace stub**

```bash
cat ~/.claude/plugins/cache/claude-cloud-architect/archimedes/0.2.0/skills/arch-navigate/SKILL.md
```

Review for:
- MCP tool names (`find_symbol`, `find_references`, `type_hierarchy`, `get_document_symbols`, `workspace_symbols`)
- These are invoked as Claude Code tool calls, NOT bash commands
- Tag schema: DEPENDENCY and ROLE tags at confidence=0.70 MACHINE CANDIDATE
- Cross-repo navigation: Serena workspace must be pointed at the repo being navigated

- [ ] **Step 2: Write skills/arch-navigate/SKILL.md**

```bash
mkdir -p plugins/archimedes/skills/arch-navigate
```

Key adaptations:
- Clarify that Serena MCP tools are used as native Claude Code tool calls (not shell commands)
- Add workspace configuration note (Serena MCP needs `--workspace` arg or auto-detects from project root)
- Add NEVER list: never use Serena for pattern matching (use ast-grep), never treat dynamic dispatch results as confirmed

- [ ] **Step 3: Run skill-judge — first pass**

```
Use skill-judge skill to evaluate plugins/archimedes/skills/arch-navigate/SKILL.md
```

- [ ] **Step 4: Iterate until ≥115/120**

Watch for:
- D1: The unique value of arch-navigate is exact LSP results vs probabilistic osgrep — make this contrast explicit
- D2: Include thinking framework: "Before navigating — what symbol am I looking for? Where should it be defined? What would I do if it's dynamically dispatched?"
- D5: Progressive disclosure — load `cookbook/serena/cli.md` only when setting up Serena for the first time

- [ ] **Step 5: Commit**

```bash
git add plugins/archimedes/skills/arch-navigate/SKILL.md
git commit -m "feat(archimedes): add arch-navigate skill (Serena LSP symbol navigation, >=115/120 skill-judge)"
```

---

## Chunk 4: Atomic Skills — Docs + Flows

### Task 8: arch-docs SKILL.md

**Files:**
- Create: `skills/arch-docs/SKILL.md`
- Source: `~/.claude/plugins/cache/claude-cloud-architect/archimedes/0.2.0/skills/arch-docs/SKILL.md`

Target: ≥115/120 on skill-judge. **Critical adaptation:** remove all `rlmgrep` references (package does not exist). This skill uses `qmd` only.

- [ ] **Step 1: Read the marketplace stub**

```bash
cat ~/.claude/plugins/cache/claude-cloud-architect/archimedes/0.2.0/skills/arch-docs/SKILL.md
```

Identify all rlmgrep references to remove/replace with qmd equivalents.

- [ ] **Step 2: Write skills/arch-docs/SKILL.md**

```bash
mkdir -p plugins/archimedes/skills/arch-docs
```

Adaptations:
- Replace all `rlmgrep` commands with equivalent `qmd query` or `qmd search` commands
- Add explicit note: "rlmgrep does not exist — this skill uses qmd exclusively"
- Verify qmd commands match `qmd --help` output (collection workflow: add → query → remove)
- Tag schema: FLOW, DEBT, RISK tags at confidence=0.60 MACHINE CANDIDATE

- [ ] **Step 3: Test qmd workflow on actual docs**

```bash
# Index and query against a real docs directory to verify commands work
qmd collection add /path/to/wellcube-device-data-processing/docs --name wcdp-docs 2>&1
qmd query "architectural decision database" 2>&1 | head -20
qmd collection remove wcdp-docs 2>/dev/null || true
```

Correct any command discrepancies in the SKILL.md.

- [ ] **Step 4: Run skill-judge — first pass**

```
Use skill-judge skill to evaluate plugins/archimedes/skills/arch-docs/SKILL.md
```

- [ ] **Step 5: Iterate until ≥115/120**

Watch for:
- D1: Expert knowledge = what documents to prioritize (ADRs > READMEs > general docs), how to distinguish real architectural intent from boilerplate
- D3: NEVER list — never index node_modules or generated docs, never treat README marketing copy as architectural intent
- D8: Include fallback when docs directory doesn't exist or is empty

- [ ] **Step 6: Commit**

```bash
git add plugins/archimedes/skills/arch-docs/SKILL.md
git commit -m "feat(archimedes): add arch-docs skill (qmd documentation mining, >=115/120 skill-judge)"
```

---

### Task 9: arch-flows SKILL.md

**Files:**
- Create: `skills/arch-flows/SKILL.md`
- Source: `~/.claude/plugins/cache/claude-cloud-architect/archimedes/0.2.0/skills/arch-flows/SKILL.md`

Target: ≥115/120 on skill-judge. Rivière is installed — verify every command against the actual CLI.

- [ ] **Step 1: Read the marketplace stub**

```bash
cat ~/.claude/plugins/cache/claude-cloud-architect/archimedes/0.2.0/skills/arch-flows/SKILL.md
```

- [ ] **Step 2: Verify all Rivière commands**

```bash
# Verify key commands exist
riviere builder init --help 2>&1
riviere builder add-component --help 2>&1
riviere builder link --help 2>&1
riviere builder finalize --help 2>&1
riviere query trace --help 2>&1
riviere extract --help 2>&1
```

Note any flags that differ from the stub. The actual Rivière v0.8.9 CLI is authoritative.

- [ ] **Step 3: Write skills/arch-flows/SKILL.md**

```bash
mkdir -p plugins/archimedes/skills/arch-flows
```

Adaptations:
- Correct any Rivière CLI flag mismatches found in Step 2
- Clarify: FLOW tags are HUMAN weight (Rivière schemas are schema-enforced), BOUNDARY tags are MACHINE weight
- Add workflow: load tag store context → identify entry points → trace flows → write Rivière schema → write FLOW tags

- [ ] **Step 4: Run skill-judge — first pass**

```
Use skill-judge skill to evaluate plugins/archimedes/skills/arch-flows/SKILL.md
```

- [ ] **Step 5: Iterate until ≥115/120**

Watch for:
- D1: Expert knowledge = how to identify flow entry points from tag store findings (ORCHESTRATION ROLE tags + route handler PATTERN tags), how to handle gaps in coverage
- D2: Thinking framework: "What is the flow's entry trigger? What data does it read? What does it write? Where does it terminate?"
- D3: NEVER list — never create FLOW tags without a Rivière schema backing them, never finalize a graph with orphan components
- D8: Include `riviere query trace` usage after building the graph to verify flows are connected

- [ ] **Step 6: Commit**

```bash
git add plugins/archimedes/skills/arch-flows/SKILL.md
git commit -m "feat(archimedes): add arch-flows skill (Riviere cross-repo flow synthesis, >=115/120 skill-judge)"
```

---

## Chunk 5: Workflow Skills

### Task 10: arch-trace-flow SKILL.md

**Files:**
- Create: `skills/arch-trace-flow/SKILL.md`

New from scratch. This is the orchestrating workflow skill that chains: arch-navigate → arch-observe → arch-search → arch-flows. It produces the Phase 3 gate artifact: a valid Rivière schema for ≥1 operation flow.

- [ ] **Step 1: Write skills/arch-trace-flow/SKILL.md**

```bash
mkdir -p plugins/archimedes/skills/arch-trace-flow
```

Structure:

```markdown
---
name: arch-trace-flow
description: "End-to-end operation flow tracing across repositories. Chains arch-navigate
(exact symbol location) → arch-observe (role classification) → arch-search (semantic
discovery) → arch-flows (Rivière schema synthesis). USE WHEN: tracing a named operation
from entry point to storage boundary, mapping cross-repo call chains, or producing
Rivière flow schemas for architecture documentation. Requires Phase 1 + Phase 2 tags
already in session."
---
```

Workflow steps the skill instructs:
1. **Pre-flight**: verify session has PATTERN + CANDIDATE tags from Phases 1+2; if not, run arch-map-service first
2. **Identify entry point**: query tag store for PATTERN tags with `route-handler` or `event-handler` subkind matching the operation name
3. **Navigate (arch-navigate)**: use `find_symbol` to get exact file + line; use `find_references` to trace callers
4. **Observe (arch-observe)**: run `osgrep classify` on the entry point file and its immediate downstream calls
5. **Search (arch-search)**: run semantic query to surface any related components missed by ast-grep
6. **Synthesize (arch-flows)**: `riviere builder init` → `add-component` for each node → `link` between nodes → `finalize`
7. **Write FLOW tag**: write the finalized Rivière schema path as a FLOW tag to the session tag store

Anti-patterns to include:
- NEVER start flow synthesis without a named operation (vague "map the whole system" produces unusable flows)
- NEVER skip the arch-navigate step — probabilistic results (osgrep/chunkhound) must be anchored by at least one LSP-verified symbol
- NEVER finalize a Rivière graph with more than 20% orphan components

- [ ] **Step 2: Run skill-judge — first pass**

```
Use skill-judge skill to evaluate plugins/archimedes/skills/arch-trace-flow/SKILL.md
```

- [ ] **Step 3: Iterate until ≥115/120**

Watch for:
- D1: The unique expert value = the ordering and combination of tier 1+2+3 tools; what each tier adds that the others miss
- D2: Decision tree for "what if arch-navigate can't find the symbol?" (fall back to osgrep classify on directory)
- D4: Description must include trigger keywords: "trace flow", "operation flow", "cross-repo", "Rivière"

- [ ] **Step 4: Commit**

```bash
git add plugins/archimedes/skills/arch-trace-flow/SKILL.md
git commit -m "feat(archimedes): add arch-trace-flow workflow skill (navigate→observe→search→flows, >=115/120)"
```

---

### Task 11: arch-assess-debt SKILL.md

**Files:**
- Create: `skills/arch-assess-debt/SKILL.md`

New from scratch. Workflow: arch-structure (PATTERN/DEBT tags) → arch-observe (ROLE classification) → arch-docs (FLOW/RISK from documentation). Produces a debt summary from the session tag store.

- [ ] **Step 1: Write skills/arch-assess-debt/SKILL.md**

```bash
mkdir -p plugins/archimedes/skills/arch-assess-debt
```

Structure:

```markdown
---
name: arch-assess-debt
description: "Comprehensive technical debt assessment combining deterministic patterns,
role classification, and documentation mining. Chains arch-structure (anti-pattern
detection) → arch-observe (coupling hotspots) → arch-docs (debt mentioned in ADRs and
design docs). USE WHEN: auditing a service for migration readiness, identifying modernization
candidates, or producing an architectural health report. Writes DEBT and RISK tags."
---
```

Workflow steps:
1. **Pre-flight**: check for existing PATTERN tags in session (run arch-structure if missing)
2. **Anti-patterns**: query tag store for PATTERN tags with anti-pattern subkinds (e.g., `dynamodb-scan-antipattern`, `lambda-cold-start-risk`, `secret-hardcoded-ts`, `mqtt-wildcard-antipattern`)
3. **Role coupling**: run `osgrep classify --dir src/` to find ORCHESTRATION components with high cyclomatic complexity (complexity > 20 = DEBT candidate)
4. **Doc debt**: run arch-docs to mine ADRs and design docs for "tech debt", "migration", "deprecated", "TODO" mentions
5. **Synthesize**: aggregate all DEBT and RISK tags by confidence; produce ordered remediation list

- [ ] **Step 2: Run skill-judge — first pass**

```
Use skill-judge skill to evaluate plugins/archimedes/skills/arch-assess-debt/SKILL.md
```

- [ ] **Step 3: Iterate until ≥115/120**

- [ ] **Step 4: Commit**

```bash
git add plugins/archimedes/skills/arch-assess-debt/SKILL.md
git commit -m "feat(archimedes): add arch-assess-debt workflow skill (structure→observe→docs, >=115/120)"
```

---

## Chunk 6: Agents

### Task 12: Adopt Phase 3 Agent Files

**Files:**
- Create: `agents/observe-agent.md`
- Create: `agents/navigate-agent.md`
- Create: `agents/flow-agent.md`
- Create: `agents/docs-agent.md`

Adopt from marketplace stubs. These are thin agent persona wrappers that delegate to their corresponding SKILL.md — adoption is straightforward.

- [ ] **Step 1: Read all four marketplace stubs**

```bash
cat ~/.claude/plugins/cache/claude-cloud-architect/archimedes/0.2.0/agents/observe-agent.md
cat ~/.claude/plugins/cache/claude-cloud-architect/archimedes/0.2.0/agents/navigate-agent.md
cat ~/.claude/plugins/cache/claude-cloud-architect/archimedes/0.2.0/agents/flow-agent.md
cat ~/.claude/plugins/cache/claude-cloud-architect/archimedes/0.2.0/agents/docs-agent.md
```

- [ ] **Step 2: Write all four agent files**

Copy stubs verbatim. Verify each agent's `description` matches the corresponding SKILL.md description. Verify each `tools:` list is appropriate:
- `observe-agent.md`: tools: Read, Write, Edit, Glob, Grep, Bash (needs bash for osgrep)
- `navigate-agent.md`: tools: Read, Write, Edit, Glob, Grep (uses MCP tools natively)
- `flow-agent.md`: tools: Read, Write, Edit, Glob, Grep, Bash (needs bash for riviere CLI)
- `docs-agent.md`: tools: Read, Write, Edit, Glob, Grep, Bash (needs bash for qmd)

- [ ] **Step 3: Commit**

```bash
git add plugins/archimedes/agents/observe-agent.md
git add plugins/archimedes/agents/navigate-agent.md
git add plugins/archimedes/agents/flow-agent.md
git add plugins/archimedes/agents/docs-agent.md
git commit -m "feat(archimedes): add observe, navigate, flow, docs agent personas"
```

---

## Chunk 7: Phase 3 Validation Gate

### Task 13: Validate arch-trace-flow on wellcube-device-data-processing

**Gate:** `arch-trace-flow` produces a valid Rivière schema for ≥1 operation flow in Delos.

**Repo:** `/path/to/wellcube-device-data-processing` (substitute actual path)
**Prerequisites:** Existing session `wcdp-20260223` with 65 HUMAN + 98 CANDIDATE tags from Phases 1+2.

- [ ] **Step 1: Verify existing session tags are present**

```bash
bun tools/tag-store.ts query \
  "SELECT kind, weight_class, COUNT(*) FROM tags GROUP BY kind, weight_class" \
  --session wcdp-20260223
```

Expected: PATTERN/HUMAN, DEPENDENCY/HUMAN, CAPABILITY/MACHINE, DEPENDENCY/MACHINE tags present.

- [ ] **Step 2: Run arch-observe on wellcube-device-data-processing**

Using the arch-observe skill, classify the service's source files:

```bash
# Classify all TypeScript source files by architectural role
osgrep classify --dir /path/to/wellcube-device-data-processing/src --json 2>/dev/null \
  | head -100
```

For each classified file with role ORCHESTRATION or INTEGRATION, write a ROLE tag:

```bash
bun tools/tag-store.ts write --tag '{
  "target_type": "FILE",
  "target_ref": "src/handlers/deviceDataHandler.ts",
  "target_repo": "/path/to/wellcube-device-data-processing",
  "kind": "ROLE",
  "value": "{\"role\": \"ORCHESTRATION\", \"rationale\": \"...\"}",
  "confidence": 0.70,
  "weight_class": "MACHINE",
  "source_tool": "osgrep",
  "source_query": "classify --dir src/",
  "status": "CANDIDATE",
  "session_id": "wcdp-20260223"
}' --session wcdp-20260223
```

Target: ≥5 ROLE tags written.

- [ ] **Step 3: Identify a concrete operation to trace**

Query for route handler PATTERN tags to find an operation entry point:

```bash
bun tools/tag-store.ts query \
  "SELECT target_ref, value FROM tags WHERE kind='PATTERN' AND json_extract(value, '$.pattern_name') IN ('http-route-express', 'event-handler', 'sqs-lambda-trigger') LIMIT 10" \
  --session wcdp-20260223
```

Pick one operation (e.g., a specific Lambda handler or Express route).

- [ ] **Step 4: Run arch-trace-flow for the chosen operation**

Using the arch-trace-flow skill:
1. Use `find_symbol` (Serena MCP) to locate the handler function
2. Use `find_references` to trace downstream calls
3. Run `osgrep classify` on discovered files
4. Initialize Rivière graph:

```bash
riviere builder init \
  --name "wcdp-device-ingest" \
  --source "https://github.com/delos/wellcube-device-data-processing" \
  --domain '{"name":"device-data","description":"Device telemetry ingestion","systemType":"domain"}' \
  --graph /tmp/wcdp-flow.json
```

5. Add components and link:

```bash
riviere builder add-component \
  --graph /tmp/wcdp-flow.json \
  --id "device-ingest-handler" \
  --name "DeviceIngestHandler" \
  --type "Lambda" \
  --domain "device-data"

# Link components as discovered
riviere builder link \
  --graph /tmp/wcdp-flow.json \
  --source "device-ingest-handler" \
  --target "device-snapshot-pipeline"
```

6. Validate and finalize:

```bash
riviere builder validate --graph /tmp/wcdp-flow.json
riviere builder finalize --graph /tmp/wcdp-flow.json --output /tmp/wcdp-flow-final.json
```

Expected: `✅ Graph valid. N components, M links.`

- [ ] **Step 5: Verify the Rivière schema is valid**

```bash
# Query the completed flow
riviere query trace device-ingest-handler --graph /tmp/wcdp-flow-final.json
```

Expected: Connected flow from entry point to storage/queue boundary.

- [ ] **Step 6: Write FLOW tag to session**

```bash
bun tools/tag-store.ts write --tag '{
  "target_type": "FILE",
  "target_ref": "/tmp/wcdp-flow-final.json",
  "target_repo": "/path/to/wellcube-device-data-processing",
  "kind": "FLOW",
  "value": "{\"operation\": \"device-ingest\", \"entry_point\": \"DeviceIngestHandler\", \"riviere_schema\": \"/tmp/wcdp-flow-final.json\", \"component_count\": N}",
  "confidence": 0.80,
  "weight_class": "HUMAN",
  "source_tool": "riviere",
  "status": "VALIDATED",
  "session_id": "wcdp-20260223"
}' --session wcdp-20260223
```

- [ ] **Step 7: Confirm gate passage**

```bash
bun tools/tag-store.ts query \
  "SELECT kind, status, COUNT(*) FROM tags WHERE session_id='wcdp-20260223' GROUP BY kind, status" \
  --session wcdp-20260223
```

**Gate PASS criteria:**
- ≥1 FLOW/VALIDATED tag in the session
- Rivière schema file is non-empty and passes `riviere builder validate`
- `riviere query trace` produces a connected chain (no orphans)

- [ ] **Step 8: Record gate result in plan**

Update this plan's header to reflect the gate result:
```
Phase 3 gate: PASS ✅ — [N] components, [M] links in Rivière schema for operation [name] — session wcdp-20260223
```

- [ ] **Step 9: Final commit**

```bash
git add plugins/archimedes/docs/plans/2026-02-25-archimedes-phase3-agentic.md
git commit -m "docs: record Phase 3 gate result (arch-trace-flow Riviere schema)"
```

---

## Skill-Judge Quick Reference

All skills must hit ≥115/120. Use this loop for every skill:

```
1. Write/adopt SKILL.md
2. Use skill-judge skill: evaluate plugins/archimedes/skills/<name>/SKILL.md
3. Read full report — note score per dimension
4. Fix all issues from the report
5. Re-run skill-judge
6. Repeat until score ≥115/120
7. Commit with message: "feat: add <skill> (>=115/120 skill-judge)"
```

**Common failure patterns from Phase 1+2 experience (8 loops each):**
- D1 Knowledge Delta: Removing "what is X" sections and generic best practices is the fastest win
- D3 Anti-Patterns: NEVER lists must include WHY — vague "avoid errors" scores 0
- D4 Description: Must answer WHAT + WHEN + include 3+ searchable trigger keywords
- D5 Progressive Disclosure: If >300 lines, move supporting content to a `references/` subdirectory

---

## Skill Quality Targets

| Skill | Type | Target | Source |
|-------|------|--------|--------|
| arch-observe | Atomic | ≥115/120 | Marketplace stub → validate |
| arch-navigate | Atomic | ≥115/120 | Marketplace stub → validate |
| arch-docs | Atomic | ≥115/120 | Marketplace stub → adapt (qmd-only) → validate |
| arch-flows | Atomic | ≥115/120 | Marketplace stub → validate |
| arch-trace-flow | Workflow | ≥115/120 | Write from scratch |
| arch-assess-debt | Workflow | ≥115/120 | Write from scratch |

---

## Phase 3 Gate

```
Gate: arch-trace-flow produces a valid Rivière schema for ≥1 operation flow in Delos
Result: ____ (fill in after Task 13)
```
