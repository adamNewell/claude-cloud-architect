# ast-grep Pattern Writing Reference

This guide explains how to write and test ast-grep rule files for Archimedes pattern packs.

---

## Rule File Structure

Every Archimedes rule file is a YAML file with two logical sections:
1. The `archimedes:` metadata block (read by Archimedes, stripped before passing to ast-grep)
2. The ast-grep rule body (`id`, `language`, `rule`, and optional fields)

### Minimal rule file
```yaml
archimedes:
  kind: PATTERN
  subkind: my-pattern
  confidence: 0.80
  weight_class: MACHINE
  target_type: FILE

id: my-pack-my-pattern
language: TypeScript
rule:
  pattern: "const $VAR = new MyClass()"
```

### Full rule file with all fields
```yaml
archimedes:
  kind: DEBT
  subkind: dynamodb-full-scan
  confidence: 0.85
  weight_class: HUMAN
  target_type: FILE
  note: "DynamoDB Scan reads entire table — expensive at scale, replace with Query + GSI"

id: aws-dynamodb-scan
language: TypeScript
note: "DynamoDB Scan reads entire table — expensive at scale, replace with Query + GSI"
rule:
  pattern: $CLIENT.send(new ScanCommand($$$ARGS))
```

---

## `archimedes:` Metadata Fields

| Field | Required | Description | Valid Values |
|-------|----------|-------------|--------------|
| `kind` | Yes | Tag taxonomy bucket | `PATTERN`, `DEPENDENCY`, `CAPABILITY`, `ROLE`, `FLOW`, `DEBT`, `RISK` |
| `subkind` | Recommended | More specific label within the kind | Free text: `lambda-handler`, `dynamodb-full-scan`, etc. |
| `confidence` | Recommended | How certain this rule is when it matches | `0.0` – `1.0` (see schema.md for guidelines) |
| `weight_class` | Recommended | Authority class of the match | `HUMAN` (deterministic) or `MACHINE` (inferred) |
| `target_type` | Recommended | What the tag describes | `FILE`, `DIRECTORY`, `SERVICE`, `REPO` |
| `note` | Optional | Human-readable explanation for DEBT/RISK tags | Free text string |

---

## Pattern Syntax Cheat Sheet

### Metavariables

| Syntax | Name | Matches |
|--------|------|---------|
| `$VAR` | Single-node metavariable | Exactly one AST node (identifier, literal, expression) |
| `$$$VAR` | Multi-node metavariable | Zero or more nodes (argument lists, body statements, etc.) |

Named metavariables are required in ast-grep 0.41.0+. Anonymous `$$$` is no longer valid — always provide a name.

```yaml
# Correct: named metavariables
rule:
  pattern: "export const handler = async ($EVENT, $CTX) => { $$$BODY }"

# Wrong: anonymous variadic (fails in 0.41.0+)
rule:
  pattern: "export const handler = async ($$, $$) => { $$$ }"
```

### Combinators

#### `any:` — OR (matches if any pattern matches)
```yaml
rule:
  any:
    - pattern: "export const handler = async ($EVENT, $CTX) => { $$$BODY }"
    - pattern: "export async function handler($EVENT, $CTX) { $$$BODY }"
    - pattern: "module.exports.handler = async ($EVENT) => { $$$BODY }"
```

#### `all:` — AND (matches only when all sub-rules match simultaneously)
```yaml
rule:
  all:
    - pattern: "$CLIENT.send($CMD)"
    - has:
        pattern: "new ScanCommand($$$ARGS)"
```

#### `not:` — Negation (exclude matches that also match the sub-rule)
```yaml
rule:
  pattern: "const $VAR = new $CLIENT({ region: $REGION })"
  not:
    inside:
      any:
        - kind: function_declaration
        - kind: arrow_function
```

### Relational Rules

#### `inside:` — Node must be inside a node of the given kind or pattern
```yaml
# Match SDK client init only when inside a function (not at module scope)
rule:
  pattern: "const $VAR = new $CLIENT({ region: $REGION })"
  not:
    inside:
      any:
        - kind: function_declaration
        - kind: arrow_function
        - kind: function_expression
```

#### `has:` — Node must contain a child matching the sub-rule
```yaml
# Match any call expression that contains ScanCommand
rule:
  has:
    pattern: "new ScanCommand($$$ARGS)"
```

#### `follows:` / `precedes:` — Positional matching (less commonly used)
```yaml
# Match a statement that follows an import declaration
rule:
  follows:
    kind: import_declaration
```

### Matching by AST Node Kind

Use `kind:` to match by tree-sitter node type instead of a text pattern:
```yaml
rule:
  kind: class_declaration
```

Combined with `has:`:
```yaml
# A class that has a method named 'save'
rule:
  kind: class_declaration
  has:
    kind: method_definition
    has:
      kind: identifier
      regex: "^save$"
```

### Regex in Patterns

Use `regex:` to match text content with a regular expression:
```yaml
rule:
  kind: string
  regex: "^AKIA[0-9A-Z]{16}$"
```

---

## Common Pitfalls

### 1. Unnamed variadic metavariable (`$$$` without a name)
ast-grep 0.41.0 requires named variadic metavariables. Always give them a name.

```yaml
# Wrong
pattern: "function $NAME($$$) { $$$ }"

# Correct
pattern: "function $NAME($$$PARAMS) { $$$BODY }"
```

### 2. TypeScript type annotations with colons must be in quotes

When a pattern contains a colon that is part of TypeScript syntax (type annotation), the YAML parser will misinterpret it as a YAML key separator unless the pattern is quoted.

```yaml
# Wrong — YAML will break on the colon
rule:
  pattern: const $V: $T = $VAL

# Correct — wrap in double quotes
rule:
  pattern: "const $V: $T = $VAL"
```

Same applies to function parameters with types:
```yaml
# Correct
rule:
  any:
    - pattern: "export const handler = async ($EVENT: $TYPE, $CTX: $CTXTYPE) => { $$$BODY }"
    - pattern: "export const handler = async ($EVENT, $CTX) => { $$$BODY }"
```

### 3. Python decorators — simplify multiline patterns

Python decorators followed by a function definition often fail to match when written as a single multiline pattern string because indentation and newline handling is inconsistent. Simplify to the decorator line alone and use `has:` or separate patterns.

```yaml
# Unreliable — multiline Python pattern
rule:
  pattern: |
    @app.get($PATH)
    def $FUNC($$$ARGS):
      $$$BODY

# More reliable — match the decorator call, use separate patterns for get/post
rule:
  any:
    - pattern: "@app.get($$$ARGS)"
    - pattern: "@app.post($$$ARGS)"
    - pattern: "@router.get($$$ARGS)"
    - pattern: "@router.post($$$ARGS)"
```

### 4. Optional arguments — `$$$ARGS` requires at least one match in some contexts

In some positions, `$$$ARGS` matches zero or more nodes but the surrounding syntax must still be valid. When targeting both zero-arg and one-arg calls, add a variant:

```yaml
rule:
  any:
    - pattern: "someFunction()"
    - pattern: "someFunction($$$ARGS)"
```

### 5. Forgetting to strip `archimedes:` before scanning
ast-grep will error or silently ignore the rule if the `archimedes:` block is present. Always strip it first:

```bash
yq 'del(.archimedes)' rule.yaml > /tmp/rule-clean.yaml
ast-grep scan --rule /tmp/rule-clean.yaml . --json
```

---

## Adding a New Rule to a Pack

### Step 1: Create the rule file

Place the file in the appropriate pack directory:
```
plugins/archimedes/patterns/<pack-name>/rules/<rule-id>.yaml
```

Naming convention: `<pack-prefix>-<description>.yaml`
- Core pack: `http-route-express.yaml`, `event-emit-ts.yaml`
- AWS Serverless pack: `lambda-handler-esm.yaml`, `dynamodb-v3.yaml`
- IoT Core pack: `mqtt-connect.yaml`, `ggv2-ipc-client-py.yaml`

### Step 2: Write the rule

```yaml
archimedes:
  kind: PATTERN             # or DEBT, RISK, DEPENDENCY, etc.
  subkind: my-new-pattern   # descriptive label
  confidence: 0.80          # how certain when it matches
  weight_class: MACHINE     # MACHINE for inferred, HUMAN for declarative
  target_type: FILE

id: mypack-my-new-pattern   # must be unique across all packs
language: TypeScript        # or Python, JavaScript, etc.
rule:
  pattern: "MyClass.$METHOD($$$ARGS)"
```

### Step 3: Test against a fixture

Add or reuse a fixture file in `tests/patterns/fixtures/`. Then test interactively:

```bash
yq 'del(.archimedes)' plugins/archimedes/patterns/mypack/rules/my-rule.yaml \
  > /tmp/rule.yaml
ast-grep scan --rule /tmp/rule.yaml tests/patterns/fixtures/my-fixture.ts --json | jq .
```

Expected output: an array with at least one match object.

### Step 4: Confirm the rule is registered

Check that the pack's `pack.yaml` references the new rule (or that the pack uses glob discovery):

```bash
cat plugins/archimedes/patterns/<pack-name>/pack.yaml
```

---

## Adding a Check to verify-patterns.sh

The smoke test script is at `tests/patterns/verify-patterns.sh`. It uses a `check` helper function:

```bash
check "<rule-file>" "<fixture-file>" <min-matches> "<label>"
```

### Add a check for a new rule

Open `tests/patterns/verify-patterns.sh` and add a line in the appropriate pack section:

```bash
echo ""
echo "=== My Pack ==="
check "$PLUGIN_ROOT/patterns/mypack/rules/my-rule.yaml" \
  "$FIXTURES/my-fixture.ts" 1 "MyPack: Description of what this checks"
```

The `<min-matches>` argument is the minimum number of matches required to pass. Use `1` unless you know exactly how many matches the fixture should produce.

### Run the full smoke test
```bash
bash tests/patterns/verify-patterns.sh
```

Expected output:
```
=== Core Pack ===
✅ Core: Express route handlers (3 matches)
...
Results: 25 passed, 0 failed
```

---

## Example Rules by Pattern Type

### Simple structural match (PATTERN)
```yaml
archimedes:
  kind: PATTERN
  subkind: repository-class
  confidence: 0.85
  weight_class: MACHINE
  target_type: FILE

id: core-repository-class-ts
language: TypeScript
rule:
  pattern: "class $NAME extends Repository { $$$BODY }"
```

### Debt detection with note (DEBT)
```yaml
archimedes:
  kind: DEBT
  subkind: hardcoded-credential
  confidence: 0.90
  weight_class: HUMAN
  target_type: FILE
  note: "Hardcoded credential detected — use environment variables or Secrets Manager"

id: core-secret-hardcoded
language: TypeScript
rule:
  any:
    - pattern: "const $VAR = \"AKIA$KEY\""
    - pattern: "const $VAR = \"sk_live_$KEY\""
```

### Negation-based risk detection (RISK)
```yaml
archimedes:
  kind: DEBT
  subkind: lambda-cold-start-risk
  confidence: 0.70
  weight_class: MACHINE
  target_type: FILE
  note: "Module-level SDK client init runs on every cold start"

id: aws-lambda-cold-start-module-client
language: TypeScript
rule:
  pattern: "const $VAR = new $CLIENT({ region: $REGION })"
  not:
    inside:
      any:
        - kind: function_declaration
        - kind: arrow_function
        - kind: function_expression
```

### Multi-language OR pattern (PATTERN)
```yaml
archimedes:
  kind: PATTERN
  subkind: http-route-handler
  confidence: 0.90
  weight_class: HUMAN
  target_type: FILE

id: core-http-route-fastapi
language: Python
rule:
  any:
    - pattern: "@app.get($$$ARGS)"
    - pattern: "@app.post($$$ARGS)"
    - pattern: "@router.get($$$ARGS)"
    - pattern: "@router.post($$$ARGS)"
```
