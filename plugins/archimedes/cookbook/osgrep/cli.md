<!-- Verified: osgrep v0.5.16 -->

# osgrep CLI Reference

osgrep is an AI-powered code intelligence tool that indexes code and enables semantic search, symbol analysis, and call graph tracing. It goes beyond structural matching (ast-grep) to understand the semantic meaning of code.

**Note:** The marketplace stub references planned features (`classify`, `daemon`, `debt`) that are not yet available in v0.5.16. This reference documents the actual v0.5.16 CLI.

## Installation

```bash
npm install -g osgrep
# or
pip install osgrep
```

## Setup

osgrep requires one-time setup to download models:

```bash
osgrep setup
```

## Indexing

Before using search or trace features, index your codebase:

```bash
# Index current directory
osgrep index

# Index specific directory
osgrep index --path /path/to/project

# Reset and re-index from scratch
osgrep index --reset

# Dry run to see what would be indexed
osgrep index --dry-run

# Verbose output with file names
osgrep index -v
```

## Symbol Search

Find symbols and their definitions:

```bash
# List all indexed symbols
osgrep symbols

# Find symbols matching a pattern
osgrep symbols "processOrder"

# Limit results
osgrep symbols --limit 50

# Filter by path prefix
osgrep symbols --path src/orders
```

## Call Graph Tracing

Trace the call graph for a specific symbol:

```bash
# Trace a symbol
osgrep trace "OrderService.processOrder"

# Trace from a specific file
osgrep trace "src/orders/order.service.ts:processOrder"
```

## Semantic Search

Search codebase by semantic pattern:

```bash
# Basic search
osgrep search "authentication logic" src/

# Show full chunk content
osgrep search "payment processing" --content

# Limit results
osgrep search "async database" --max-count 10

# Per-file limit
osgrep search "validation" --per-file 5

# Show relevance scores
osgrep search "error handling" --scores

# Filter by minimum score (0-1)
osgrep search "logging" --min-score 0.7

# Compact output
osgrep search "service" --compact

# Dry run (check without indexing)
osgrep search "repository" --dry-run

# Sync before search
osgrep search "controller" --sync
```

## Code Skeleton

View function/method signatures without implementation:

```bash
# Show skeleton for a file or symbol
osgrep skeleton "src/orders/order.service.ts"

osgrep skeleton "OrderService"
```

## Background Server

Run osgrep as a background server for repeated queries:

```bash
# Start server
osgrep serve --port 4444

# Run in background
osgrep serve --background --port 4444

# Check status of background servers
osgrep serve status

# Stop background servers
osgrep serve stop
```

## MCP Server

Start osgrep as an MCP (Model Context Protocol) server:

```bash
osgrep mcp
```

## Project Information

Show current project's .osgrep store contents:

```bash
osgrep list
```

## Diagnostics

Check osgrep health and configuration:

```bash
osgrep doctor
```

## Installation for Other Tools

osgrep can be installed as a plugin for various code tools:

```bash
# Install as Claude Code plugin
osgrep install-claude-code

# Install for Codex
osgrep install-codex

# Install for Factory Droid
osgrep install-droid

# Install as OpenCode plugin (Daemon + Tool)
osgrep install-opencode

# Uninstall OpenCode plugin
osgrep uninstall-opencode
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Command successful |
| 1 | Error during execution |
| 2 | Invalid flags or arguments |

## Known Issues and Limitations

### v0.5.16 Limitations

- The marketplace stub references planned features (`classify`, `daemon`, `debt`) not yet available in v0.5.16
- Planned feature: Role classification (ORCHESTRATION, DEFINITION, INTEGRATION, INFRASTRUCTURE, FRONTEND roles)
- Planned feature: Structural debt detection (coupling, circular dependencies, layering violations)
- Current version focuses on indexing, search, tracing, and symbol analysis

### Common Issues

- First run requires `osgrep setup` to download models (~500MB)
- Large codebases (>50K files) may require significant memory for indexing
- Binary and generated files may be indexed -- use `.osgrep-ignore` to exclude them if needed
- Search results are sorted by relevance score (0-1)

## Global Options

```bash
# Use specific store (auto-detected if not specified)
osgrep --store <path> <command>

# Show help
osgrep <command> --help

# Show version
osgrep --version
```

## Archimedes Integration

osgrep is used in Archimedes for:
- Semantic code search during architecture analysis
- Symbol tracing for call chain analysis
- Code indexing for upstream knowledge preparation

Current v0.5.16 produces SYMBOL and TRACE tags. Future versions planned to produce ROLE, DEPENDENCY, and DEBT tags.
