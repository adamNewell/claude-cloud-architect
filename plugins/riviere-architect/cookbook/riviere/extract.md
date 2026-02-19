# Cookbook: riviere extract

Source-scanning command — processes source code to identify architectural components.

```bash
npx riviere extract [options]
```

> **Workflow note:** The riviere-architect plugin uses agent-based extraction in Extract
> (Claude reads source files and writes staged JSONL) rather than `riviere extract`.
> Use `riviere extract` as an alternative when you have an extraction config file and
> want CLI-driven output instead.

---

## Flags

| Flag                   | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `--config <path>`      | Extraction configuration file **(required)**                       |
| `-o, --output <file>`  | Write results to file instead of stdout                            |
| `--enrich <file>`      | Read draft components and enhance with extraction rules            |
| `--base <branch>`      | Override base branch for PR analysis                               |
| `--files <paths...>`   | Target specific files instead of full repo scan                    |
| `--format <type>`      | Output format: `json` (default) or `markdown`                      |
| `--dry-run`            | Show component counts per domain without full output               |
| `--components-only`    | Output component identity only, skip metadata enrichment           |
| `--allow-incomplete`   | Output components even when some extraction fields fail            |
| `--pr`                 | Extract from files changed in current branch vs base branch        |
| `--stats`              | Display extraction statistics on stderr                            |
| `--patterns`           | Enable pattern-based connection detection                          |
| `--no-ts-config`       | Skip `tsconfig.json` auto-discovery                                |

---

## Examples

```bash
# Full repo scan with config
riviere extract --config .riviere/extract.config.json

# Write to file in markdown format
riviere extract --config .riviere/extract.config.json \
  --output .riviere/extracted.md \
  --format markdown

# Preview component counts only
riviere extract --config .riviere/extract.config.json --dry-run

# Extract only changed files in current PR branch
riviere extract --config .riviere/extract.config.json --pr

# Target specific files
riviere extract --config .riviere/extract.config.json \
  --files src/api/orders.ts src/usecases/PlaceOrder.ts

# Extract and enrich against draft components
riviere extract --config .riviere/extract.config.json \
  --enrich .riviere/work/extract-orders-service.jsonl
```

---

## Graph File Location

Default: `.riviere/graph.json`

Override with `--graph <path>` on any command.
