# Serena LSP CLI Reference

Serena is an MCP (Model Context Protocol) server that exposes Language Server Protocol (LSP) capabilities to Claude Code agents. It provides zero-indexing-cost, live symbolic navigation -- find symbols, trace references, explore type hierarchies, and rename symbols across a codebase.

## Setup

Serena runs as an MCP server, NOT as a CLI tool. Tools are invoked as Claude Code tool calls (not bash commands).

### Configure in Claude Code

Edit `~/.claude/settings.json` and add Serena to the `mcpServers` section:

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": ["--from", "serena", "serena-mcp-server"],
      "env": {}
    }
  }
}
```

**Required:** Restart Claude Code after adding this configuration for the MCP server to initialize.

### How It Works

- Serena automatically detects your workspace from Claude Code's current working directory
- Tools are invoked as MCP tool calls within agent/code contexts, not as bash commands
- The LSP server runs in the background with zero indexing cost (leverages Claude Code's existing session)
- First query in a session may take 2-5s for large workspaces (>10k files) while LSP initializes
- Subsequent queries are ~100ms round-trip latency

## Available MCP Tools

Tools are invoked as Claude Code MCP tool calls. Example patterns shown below use agent/code notation, not bash.

### find_symbol

Find all definitions of a named symbol across the workspace.

```
Tool: find_symbol
Parameters:
  name_path (string): Symbol name or path (e.g., "OrderService", "OrderService.processOrder")
  kind (string, optional): "class" | "function" | "variable" | "interface" | "type"

Returns: Array of symbol locations with file path, line range, and docstring
```

**Agent usage example:**
```
Use the find_symbol tool to locate all definitions of "PaymentService"
-> Returns: file path, line numbers, class/function signature, docstring
```

### find_references

Find all usages of a symbol across the workspace.

```
Tool: find_references
Parameters:
  name_path (string): Symbol to find references for
  include_declaration (boolean, default: false): Include the declaration itself

Returns: Array of usage locations with file path, line number, and context
```

**Agent usage example:**
```
Use find_references to find all callers of "OrderRepository.save"
-> Returns: every file and line that calls this method
```

### type_hierarchy

Explore the inheritance and implementation hierarchy of a type.

```
Tool: type_hierarchy
Parameters:
  name_path (string): Class or interface name
  direction (string): "supertypes" | "subtypes" | "both"

Returns: Tree of type relationships
```

**Agent usage example:**
```
Use type_hierarchy on "BaseRepository" with direction "subtypes"
-> Returns: all classes that extend BaseRepository
```

### rename_symbol

Rename a symbol across the entire workspace (safe refactoring via LSP).

```
Tool: rename_symbol
Parameters:
  name_path (string): Current symbol name
  new_name (string): New symbol name

Returns: List of files modified + diff preview
```

**Note:** In Archimedes analysis mode, use rename_symbol only in planning -- never apply it to client codebases without explicit instruction.

### get_document_symbols

List all symbols defined in a specific file.

```
Tool: get_document_symbols
Parameters:
  file_path (string): Relative or absolute path to file

Returns: Hierarchical list of all symbols (classes, functions, variables) with ranges
```

### workspace_symbols

Search for symbols by name pattern across the workspace.

```
Tool: workspace_symbols
Parameters:
  query (string): Symbol name prefix or partial match

Returns: Matching symbols with locations
```

## Archimedes Usage

Serena complements semantic search. Use it when you need exact symbol locations, when you have a specific symbol name from osgrep or ast-grep and want to trace its references, or when building FLOW tags from precise call chains.

```
# Workflow: find a service -> trace its references -> build DEPENDENCY tags

1. Use find_symbol "OrderService" to confirm location
2. Use find_references "OrderService.processOrder" to find all callers
3. Use get_document_symbols on "src/orders/order.service.ts" to map the full API surface
4. Write DEPENDENCY tags for each caller-callee relationship found
```

Tag confidence: **0.70** (LSP-verified but may include dynamic dispatch -- MACHINE weight, CANDIDATE status)

## Performance Notes

- Zero indexing cost: LSP is always up in Claude Code sessions
- Latency: ~100ms per query (LSP round-trip)
- For large workspaces (>10k files), first query may take 2-5s while LSP initializes
- Multi-repo: run one Serena instance per repo (LSP is repo-scoped)
- Best used for targeted queries, not bulk scanning (use ast-grep for bulk)

## When to Use Serena vs ast-grep vs ColGREP

| Need | Use |
|------|-----|
| Find all usages of a specific function | Serena `find_references` |
| Detect pattern across entire repo | ast-grep |
| Conceptually similar code (no exact name) | ColGREP |
| Type hierarchy / inheritance | Serena `type_hierarchy` |
| API surface of a specific file | Serena `get_document_symbols` |
| Cross-repo semantic relationships | ColGREP |
| IaC resource detection | ast-grep |
