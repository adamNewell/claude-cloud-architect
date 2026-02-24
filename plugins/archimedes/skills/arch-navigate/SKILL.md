---
name: arch-navigate
description: "Live symbolic navigation using Serena LSP MCP tools. Serena tools are Claude Code native MCP tool calls — NOT bash commands. USE WHEN: finding exact symbol definitions, tracing all usages of a specific function or class, exploring type inheritance hierarchies, mapping the API surface of a specific file, or getting LSP-verified reference chains for flow construction. Complements osgrep (probabilistic roles) with exact symbol locations. Keywords: symbol, LSP, reference, navigate, find_symbol, find_references, type_hierarchy, get_document_symbols, workspace_symbols, exact symbol, DEPENDENCY tag, ROLE tag, call chain, inheritance, API surface."
---
# arch-navigate

Precise symbolic navigation using Serena LSP MCP tools. Zero indexing cost — queries the live language server directly for LSP-verified symbol locations.

**Core distinction:** Serena is EXACT, not probabilistic. `find_references` returns every actual call site the language server can resolve. ast-grep detects syntactic patterns across files. ColGREP finds conceptually similar code without knowing the symbol name. These tools complement each other — they are not interchangeable.

## Before Navigating — Ask These Questions

1. **What symbol am I looking for?** (exact class name, method name, or interface — not a concept)
2. **Where is it defined?** Use `find_symbol` first to confirm the symbol exists before running `find_references`
3. **Could it be dynamically dispatched?** If yes, Serena will miss those call sites — note the gap and supplement with ast-grep
4. **Is the Serena MCP server configured?** Check `~/.claude/settings.json` before invoking any tool (see Fallback section below)

## Tool Reference

Serena tools are invoked as Claude Code native MCP tool calls. They are NOT bash commands. Never wrap them in a bash block.

### find_symbol — Locate symbol definitions

```
Tool: find_symbol
Parameters:
  name_path (string): Symbol name or dotted path (e.g., "OrderService", "OrderService.processOrder")
  kind (string, optional): "class" | "function" | "variable" | "interface" | "type"

Returns: Array of symbol locations — file path, line range, signature, docstring
```

Always run `find_symbol` first to confirm a symbol exists before running `find_references`. If `find_symbol` returns empty, the symbol does not exist at the name you expect — adjust the name before proceeding.

### find_references — All usages of a symbol

```
Tool: find_references
Parameters:
  name_path (string): Symbol to find all usages of
  include_declaration (boolean, default: false): Include the definition itself

Returns: Array of usage locations — file path, line number, surrounding context
```

This is the primary tool for building DEPENDENCY tags. Each returned location is a confirmed caller or usage site.

### type_hierarchy — Inheritance and implementation chains

```
Tool: type_hierarchy
Parameters:
  name_path (string): Class or interface name
  direction (string): "supertypes" | "subtypes" | "both"

Returns: Tree of type relationships
```

Use `direction: "subtypes"` to find all classes that extend or implement a base type. Use `direction: "supertypes"` to trace what a class inherits from. Use `direction: "both"` only when you need the full hierarchy.

### get_document_symbols — All symbols in a specific file

```
Tool: get_document_symbols
Parameters:
  file_path (string): Absolute or relative path to the file

Returns: Hierarchical list of all symbols (classes, functions, variables) with line ranges
```

Use this to map the complete API surface of a file. Faster than reading the file manually when you only need the symbol list.

### workspace_symbols — Search by name pattern

```
Tool: workspace_symbols
Parameters:
  query (string): Symbol name prefix or partial match

Returns: Matching symbols with file paths and locations
```

Use when you know a partial name and need to discover full symbol names before passing them to `find_symbol` or `find_references`.

### rename_symbol — Safe LSP-based rename (planning only)

```
Tool: rename_symbol
Parameters:
  name_path (string): Current symbol name
  new_name (string): New name

Returns: Files that would be modified + diff preview
```

NEVER apply `rename_symbol` to client codebases. Use only in planning contexts to understand rename scope. This tool modifies files.

## Supporting Documentation

| Need | Load |
|------|------|
| First-time Serena MCP setup | `../../cookbook/serena/cli.md` |
| Tag schema and write commands | `../../cookbook/tag-store/schema.md` |

**Do NOT load `../../cookbook/serena/cli.md`** if Serena is already configured and working in this session. Load it only when setting up for the first time or diagnosing MCP connection issues.

## Confidence

All Serena findings: `confidence=0.70`, `weight_class=MACHINE`, `status=CANDIDATE`

LSP queries are exact — every returned location is a real symbol reference, not a text match. The 0.70 confidence (not 1.0) reflects that Serena may miss:
- Dynamic dispatch (runtime polymorphism where the concrete type is resolved at runtime)
- Reflection-based invocations (e.g., `Class.forName()`, `require(dynamicPath)`)
- Decorator-wrapped calls where the original symbol is indirectly invoked

When dynamic dispatch is likely, note the gap explicitly in DEPENDENCY tag `value.notes` and supplement with ast-grep or ColGREP.

## Execution Patterns

### Pattern 1: Map the API Surface of a Known File

**Ask first:** Am I trying to understand what a file exports, or trace who calls a specific symbol? If the former, start here. If the latter, start at Pattern 2.

```
Step 1: Use get_document_symbols on the target file
         → Returns all classes, functions, variables with line ranges
Step 2: Identify exported/public symbols (non-private, non-internal)
Step 3: For each exported symbol, optionally use find_references to count inbound callers
Step 4: Write ROLE or DEPENDENCY tags for each exported symbol found
```

### Pattern 2: Trace a Specific Call Chain

**Ask first:** Do I know the symbol's exact name, or am I guessing? If guessing → start with `workspace_symbols` to discover the exact name before running `find_symbol`. If name is certain → skip directly to Step 1.

```
Step 1: Use find_symbol to confirm the entry point exists and get its exact location
Step 2: Use find_references on the entry point to find all direct callers
Step 3: For each caller, use find_references on that caller to find ITS callers (recurse 2-3 levels)
Step 4: Stop at module/service boundaries — cross-service calls need a separate Serena session
Step 5: Write one DEPENDENCY tag per caller-callee pair discovered
```

### Pattern 3: Explore a Type Hierarchy

**Ask first:** Do I need to find what extends a type (subtypes) or what a type inherits from (supertypes)? Choose `direction` before invoking — "both" costs two LSP queries and is rarely needed.

```
Step 1: Use find_symbol to confirm the base type exists
Step 2: Use type_hierarchy with direction "subtypes" to find all implementations
Step 3: For each subtype, optionally use get_document_symbols to see overridden methods
Step 4: Write PATTERN tags for confirmed patterns (e.g., "all repositories extend BaseRepository")
```

### Pattern 4: Verify Architecture Assumptions

**Ask first:** What would falsify this assumption? State the falsification condition before querying — it determines what you're looking for in the `find_references` results.

```
Step 1: State the assumption and its falsification condition explicitly
         (e.g., "OrderService is only called through its interface — falsified if any usage is typed to OrderService directly")
Step 2: Use find_references on "OrderService" to find all usages
Step 3: Check each result: is it typed to the interface or the concrete class?
Step 4: Confirm or refute the assumption; write PATTERN tag if confirmed, DEBT tag if violated
```

## Writing Tags

**DEPENDENCY tag from find_references:**

```bash
bun tools/tag-store.ts write --tag '{
  "target_type": "SYMBOL",
  "target_ref": "OrderService.processOrder",
  "target_repo": "<absolute-repo-path>",
  "kind": "DEPENDENCY",
  "value": "{\"dependency_type\": \"call\", \"direction\": \"incoming\", \"caller\": \"OrderController.createOrder\", \"caller_file\": \"src/orders/order.controller.ts\", \"caller_line\": 42, \"description\": \"Controller calls processOrder on POST /orders\"}",
  "confidence": 0.70,
  "weight_class": "MACHINE",
  "source_tool": "serena",
  "source_query": "find_references OrderService.processOrder",
  "status": "CANDIDATE",
  "session_id": "<session-id>"
}' --session <session-id>
```

**ROLE tag from get_document_symbols (API surface):**

```bash
bun tools/tag-store.ts write --tag '{
  "target_type": "FILE",
  "target_ref": "src/orders/order.service.ts",
  "target_repo": "<absolute-repo-path>",
  "kind": "ROLE",
  "value": "{\"role\": \"service\", \"exported_symbols\": [\"processOrder\", \"cancelOrder\", \"getOrderStatus\"], \"description\": \"Core order processing service with 3 exported methods\"}",
  "confidence": 0.70,
  "weight_class": "MACHINE",
  "source_tool": "serena",
  "source_query": "get_document_symbols src/orders/order.service.ts",
  "status": "CANDIDATE",
  "session_id": "<session-id>"
}' --session <session-id>
```

## Decision Tree: Serena vs ast-grep vs ColGREP

Apply in order — first match wins.

| Need | Tool | Why |
|------|------|-----|
| All usages of a specific named function/method | Serena `find_references` | LSP-exact — returns every actual call site, not text matches |
| Where is a specific class defined? | Serena `find_symbol` | LSP-exact symbol location in one call |
| What classes extend a base type? | Serena `type_hierarchy` | LSP resolves the full hierarchy, including transitive extensions |
| All symbols exported by a specific file | Serena `get_document_symbols` | LSP enumerates every symbol with line ranges |
| Pattern detection across the full repo (syntactic) | ast-grep | Structural AST matching — faster for bulk, no symbol name needed |
| Code similar in concept but no exact name known | ColGREP | Semantic embedding — finds conceptually related code |
| Cross-repo semantic relationships | ColGREP | Serena is repo-scoped; ColGREP spans repos |
| IaC resource detection (Terraform, CDK, CloudFormation) | ast-grep | LSP support for IaC formats is limited |
| Text pattern matching (env vars, config keys, strings) | Grep | Serena does not search string literals or comments |

**Summary principle:** If you know the exact symbol name → Serena. If you know the syntactic pattern but not the name → ast-grep. If you know the concept but not the exact form → ColGREP.

## Fallback: When Serena MCP Is Unavailable

Serena requires MCP server configuration in `~/.claude/settings.json`. If it is not configured or not responding:

**Step 1 — Diagnose:** Attempt `workspace_symbols` with a known symbol name. If it fails or returns "tool not found", Serena is not connected.

**Step 2 — Configure (if first time):** **MANDATORY — READ ENTIRE FILE `../../cookbook/serena/cli.md`** before configuring MCP for the first time. Follow the setup instructions exactly. Restart Claude Code after configuring.

**Step 3 — Fallback to Grep:** If Serena cannot be configured in this session, use Grep for reference finding with reduced confidence:
- `confidence=0.50` (text match, not LSP-verified)
- `weight_class=MACHINE`, `status=CANDIDATE`
- Note in tag `value.notes`: `"serena_unavailable: true, fallback: grep"`

```bash
# Grep fallback: find usages of OrderService.processOrder
grep -rn "processOrder" $REPO/src --include="*.ts"
```

Grep fallback misses: dynamic invocations, alias references, renamed imports. Always note the limitation in the tag.

## NEVER List

- **Never invoke Serena tools as bash commands** — they are MCP tool calls, not CLI tools. There is no `serena` executable. `find_symbol` is invoked as a tool call, not `serena find_symbol`.
- **Never run `find_references` without first running `find_symbol`** — if the symbol does not exist at the name you expect, `find_references` returns empty results that look like "no callers" but actually mean "symbol not found".
- **Never treat dynamic dispatch as confirmed by Serena** — if a method is called through an interface or injected dependency, Serena may not see the concrete call sites. Note the gap.
- **Never use Serena for pattern matching across a repo** — `workspace_symbols` matches name prefixes, not structural patterns. Use ast-grep for pattern detection.
- **Never apply `rename_symbol` to client codebases** — this modifies files. Only use it in planning to assess rename scope.
- **Never write Serena DEPENDENCY tags with `confidence > 0.70`** — LSP-verified is not the same as architecturally confirmed. Dynamic dispatch and reflection lower the ceiling.
- **Never skip the `find_symbol` step** when you are uncertain about a symbol's exact name — searching with `workspace_symbols` first is faster than debugging empty `find_references` results.
- **Never run Serena as a bulk scanner** — Serena is optimized for targeted queries (one symbol at a time). For bulk repo scanning, use ast-grep or chunkhound.
- **Never treat `workspace_symbols` results as usage sites** — `workspace_symbols` returns symbols whose names match the query prefix; it is a name-discovery tool. An agent who runs `workspace_symbols "processOrder"` and gets 3 results may incorrectly infer those are all usages of `processOrder`. They are symbol definitions or declarations that match the name, not call sites. Only `find_references` returns actual usages.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "tool not found" error on any Serena tool | MCP server not configured | Load `../../cookbook/serena/cli.md`; add Serena to `~/.claude/settings.json`; restart Claude Code |
| `find_references` returns empty | Symbol name wrong, or symbol does not exist at that name | Run `find_symbol` first; try `workspace_symbols` with partial name to discover exact name |
| `type_hierarchy` returns only the queried type | Type has no subtypes (is a leaf), or LSP has not indexed the workspace | Wait 2-5s and retry; first query in a session may be slow while LSP initializes |
| First query is slow (2-5s) | LSP is initializing for large workspaces (>10k files) | Normal — subsequent queries will be ~100ms |
| Serena misses known callers | Dynamic dispatch or reflection-based invocation | Note the gap; supplement with ast-grep or Grep |
| `rename_symbol` modifies files unexpectedly | Tool was run with intent to apply, not preview | Use only in planning; do not invoke against client repos |
