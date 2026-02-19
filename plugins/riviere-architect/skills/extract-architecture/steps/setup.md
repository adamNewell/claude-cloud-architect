# Setup: Verify Prerequisites

Run the verification script below. Fix any FAIL lines before proceeding. If all checks pass, initialize the workspace and move on.

## Verify

```bash
echo "=== extract-architecture prerequisites ===" && \
  (npx riviere --version > /dev/null 2>&1 && echo "PASS  riviere-cli" || echo "FAIL  riviere-cli — run: npm install -g @living-architecture/riviere-cli") && \
  (bun --version > /dev/null 2>&1 && echo "PASS  bun" || echo "FAIL  bun — install at https://bun.sh") && \
  (ls SKILL.md > /dev/null 2>&1 && echo "PASS  working directory" || echo "FAIL  working directory — cd to the skill root (directory containing SKILL.md)") && \
  (ls tools/init-graph.ts tools/validate-graph.ts tools/ingest-wiki.ts tools/generate-link-candidates.ts > /dev/null 2>&1 && echo "PASS  tools/" || echo "FAIL  tools/ — one or more tool files missing") && \
  (ls cookbook/riviere/cli.md cookbook/qmd/cli.md > /dev/null 2>&1 && echo "PASS  cookbooks" || echo "FAIL  cookbooks — cookbook/riviere/cli.md or cookbook/qmd/cli.md missing")
```

All five lines must show PASS before continuing.

## Initialize Workspace

```bash
mkdir -p .riviere/work .riviere/config
```

## Cookbooks

The workflow loads cookbooks on demand — do not load all upfront:

| Cookbook                  | Covers                                                      | Load when                                 |
| ------------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| `cookbook/riviere/cli.md` | Command index, exit codes, concurrency rules, phase mapping | Any step using `npx riviere builder`      |
| `cookbook/qmd/cli.md`     | qmd collections, context queries, embedding lookups         | Wiki Index step or qmd-based repo queries |

## Completion

All checks PASS and workspace initialized. Proceed to `steps/explore-orchestrator.md`.
