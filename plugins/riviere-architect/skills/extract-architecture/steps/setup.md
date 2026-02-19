# Setup: Verify Prerequisites

Run the verification script below. Fix any FAIL lines before proceeding. If all checks pass, initialize the workspace and move on.

## Working Directories

Two directory contexts are used throughout this workflow:

| Context                           | Purpose                                      | Commands that run here            |
| --------------------------------- | -------------------------------------------- | --------------------------------- |
| **Skill root** (`SKILL_ROOT`)     | Contains SKILL.md, tools/, steps/, .riviere/ | `bun tools/*.ts` commands         |
| **Repository root** (`REPO_ROOT`) | The codebase being analyzed                  | `grep`, `find`, source file reads |

`SKILL_ROOT` is the directory containing SKILL.md. All `bun tools/` commands must be run from here — the tools resolve paths relative to this directory.

`REPO_ROOT` is the root of each repository being analyzed. Use absolute paths when referencing source files in subagent instructions and step prompts.

When a step says "run from skill root", use `SKILL_ROOT`. When scanning source code, resolve against `REPO_ROOT`.

## Verify

```bash
echo "=== extract-architecture prerequisites ===" && \
  (npx riviere --version > /dev/null 2>&1 && echo "PASS  riviere-cli" || echo "FAIL  riviere-cli — run: npm install -g @living-architecture/riviere-cli") && \
  (bun --version > /dev/null 2>&1 && echo "PASS  bun" || echo "FAIL  bun — install at https://bun.sh") && \
  (ls SKILL.md > /dev/null 2>&1 && echo "PASS  working directory" || echo "FAIL  working directory — cd to the skill root (directory containing SKILL.md)") && \
  (ls tools/init-graph.ts tools/validate-graph.ts tools/ingest-wiki.ts tools/generate-link-candidates.ts tools/replay-staged-links.ts tools/replay-staged-enrichments.ts tools/replay-staged-components.ts tools/split-checklist.ts tools/merge-domains.ts > /dev/null 2>&1 && echo "PASS  tools/" || echo "FAIL  tools/ — one or more tool files missing") && \
  (ls ../../cookbook/riviere/cli.md ../../cookbook/qmd/cli.md > /dev/null 2>&1 && echo "PASS  cookbooks" || echo "FAIL  cookbooks — ../../cookbook/riviere/cli.md or ../../cookbook/qmd/cli.md missing") && \
  ([ -f "SKILL.md" ] && echo "PASS  skill root (SKILL.md found in current directory)" || echo "FAIL  skill root — run this script from the extract-architecture/ directory containing SKILL.md")
```

All six lines must show PASS before continuing.

## Initialize Workspace

```bash
mkdir -p .riviere/work .riviere/config
```

> **Directory note:** `.riviere/` is created inside `SKILL_ROOT`. All step files read and write to `.riviere/` relative to the skill root. When spawning subagents to scan source code, pass `REPO_ROOT` as an absolute path explicitly — do not assume it matches `SKILL_ROOT`.

## Concurrency Policy (Mandatory)

Treat all `riviere builder` write commands as concurrency-unsafe.

Do not run concurrent writes for any of:

- `add-source`
- `add-domain`
- `define-custom-type`
- `add-component`
- `link`
- `link-http`
- `link-external`
- `enrich`
- `finalize`

Subagents may analyze in parallel, but all write commands must be executed sequentially by the coordinator.

## Cookbooks

The workflow loads cookbooks on demand — do not load all upfront:

| Cookbook                        | Covers                                                      | Load when                                 |
| ------------------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| `../../cookbook/riviere/cli.md` | Command index, exit codes, concurrency rules, phase mapping | Any step using `npx riviere builder`      |
| `../../cookbook/qmd/cli.md`     | qmd collections, context queries, embedding lookups         | Wiki Index step or qmd-based repo queries |

## Completion

All checks PASS and workspace initialized. Proceed to `steps/explore-orchestrator.md`.
