# ast-grep CLI Reference

ast-grep is the AST-based code search engine used by Archimedes to find structural patterns in source code.
Archimedes rule files contain an `archimedes:` metadata block that must be stripped before passing to ast-grep.

---

## Prerequisites

```bash
# Check ast-grep is installed and confirm version
ast-grep --version
# Expected: ast-grep 0.41.0 or higher

# Check yq is available (used to strip archimedes: block)
yq --version
```

---

## Core Usage

### Basic scan against a single file
```bash
ast-grep scan --rule path/to/rule.yaml path/to/file.ts --json
```

### Scan a directory recursively
The path argument accepts both files and directories. When given a directory, ast-grep walks it recursively and scans all files matching the rule's `language` field.
```bash
ast-grep scan --rule path/to/rule.yaml src/ --json
```

### Get match count only
```bash
ast-grep scan --rule path/to/rule.yaml src/ --json | jq 'length'
```

### Pretty-print matches
```bash
ast-grep scan --rule path/to/rule.yaml src/ --json | jq .
```

---

## Working with Archimedes Rules

Archimedes rule files contain an `archimedes:` top-level block that holds metadata (kind, subkind, confidence, etc.). ast-grep does not understand this field and will error if it is present. Always strip it first.

### Strip `archimedes:` block before scanning
```bash
yq 'del(.archimedes)' path/to/rule.yaml > /tmp/rule-clean.yaml
ast-grep scan --rule /tmp/rule-clean.yaml src/ --json
```

### Test a single rule interactively
```bash
yq 'del(.archimedes)' plugins/archimedes/patterns/aws-serverless/rules/lambda-handler-esm.yaml \
  > /tmp/rule.yaml
ast-grep scan --rule /tmp/rule.yaml tests/patterns/fixtures/sample-lambda.ts --json | jq .
```

---

## Full Pipeline: Scan and Write to Tag Store

The `write-from-ast-grep` command handles the yq strip, scan, and tag store write in one pipeline.

```bash
SESSION_ID="my-session-$(date +%s)"
REPO_ROOT="/path/to/my-repo"
RULE="plugins/archimedes/patterns/aws-serverless/rules/lambda-handler-esm.yaml"

# Strip archimedes block, scan, pipe results to tag store
yq 'del(.archimedes)' "$RULE" > /tmp/rule.yaml \
  && ast-grep scan --rule /tmp/rule.yaml "$REPO_ROOT" --json \
  | bun run tools/tag-store.ts write-from-ast-grep \
      --rule "$RULE" \
      --session "$SESSION_ID" \
      --target-repo "$REPO_ROOT"
```

The `write-from-ast-grep` command:
1. Reads `archimedes:` metadata (kind, subkind, confidence, weight_class) from the original rule file
2. Reads ast-grep JSON from stdin
3. Writes one tag per match to the tag store

---

## Scanning an Entire Pack

To scan all rules in a pack directory:

```bash
SESSION_ID="my-session-$(date +%s)"
REPO_ROOT="/path/to/my-repo"
PACK="plugins/archimedes/patterns/aws-serverless/rules"

for RULE in "$PACK"/*.yaml; do
  yq 'del(.archimedes)' "$RULE" > /tmp/rule.yaml
  MATCH_COUNT=$(ast-grep scan --rule /tmp/rule.yaml "$REPO_ROOT" --json 2>/dev/null | jq 'length')
  echo "$(basename $RULE): $MATCH_COUNT matches"

  ast-grep scan --rule /tmp/rule.yaml "$REPO_ROOT" --json 2>/dev/null \
    | bun run tools/tag-store.ts write-from-ast-grep \
        --rule "$RULE" \
        --session "$SESSION_ID" \
        --target-repo "$REPO_ROOT"
done
```

---

## Output Format

ast-grep `--json` output is a JSON array. Each element is a match object:

```json
[
  {
    "text": "export const handler = async (event, ctx) => {",
    "range": {
      "start": { "line": 3, "column": 0 },
      "end": { "line": 3, "column": 49 }
    },
    "file": "src/handlers/user.ts",
    "language": "TypeScript",
    "ruleId": "aws-lambda-handler-esm",
    "metaVariables": {
      "EVENT": "event",
      "CTX": "ctx"
    }
  }
]
```

Key fields used by `write-from-ast-grep`:
- `file` — written to `target_ref`
- `text` — written to `source_evidence`
- `ruleId` — written to `value.rule_id` and `source_query`
- `range.start.line` — written to `value.line`
- `language` — written to `value.language`

---

## Supported Languages and File Extensions

ast-grep determines the language from the `language` field in the rule file. The scanner then looks for files with matching extensions.

| Language | Common Extensions |
|----------|------------------|
| `TypeScript` | `.ts`, `.tsx` |
| `JavaScript` | `.js`, `.jsx`, `.mjs`, `.cjs` |
| `Python` | `.py` |
| `Rust` | `.rs` |
| `Go` | `.go` |
| `Java` | `.java` |
| `Kotlin` | `.kt` |
| `Swift` | `.swift` |
| `C` | `.c`, `.h` |
| `C++` | `.cpp`, `.hpp`, `.cc` |
| `Ruby` | `.rb` |
| `Yaml` | `.yaml`, `.yml` |
| `Json` | `.json` |
| `Html` | `.html` |
| `Css` | `.css` |
| `Bash` | `.sh`, `.bash` |

---

## Troubleshooting

### No matches returned
1. Verify the rule language matches the file extension
2. Strip the `archimedes:` block — ast-grep will silently fail on unknown top-level fields
3. Test against a known fixture: `ast-grep scan --rule /tmp/rule.yaml tests/patterns/fixtures/ --json | jq 'length'`
4. Try simplifying the pattern — remove type annotations first, then add them back

### `yq` not found
```bash
# macOS
brew install yq

# Linux (via snap)
snap install yq
```

### ast-grep not found
```bash
# macOS
brew install ast-grep

# Via cargo
cargo install ast-grep
```

### "Unknown field: archimedes" error
You forgot to strip the `archimedes:` block. Always run `yq 'del(.archimedes)' rule.yaml > /tmp/rule.yaml` first.
