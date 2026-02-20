# Setup: Verify Prerequisites

Run the verification script below. Fix any FAIL lines before proceeding. If all checks pass, initialize the workspace and move on.

## Working Directories

Three directory contexts are used throughout this workflow:

| Context                           | Purpose                                      | Commands that run here            |
| --------------------------------- | -------------------------------------------- | --------------------------------- |
| **Skill root** (`SKILL_ROOT`)     | Contains SKILL.md, tools/, steps/            | `bun tools/*.ts` commands         |
| **Project root** (`PROJECT_ROOT`) | User's CWD; where `.riviere/` is created     | Write/Read for `.riviere/` files  |
| **Repository root** (`REPO_ROOT`) | The codebase being analyzed                  | `grep`, `find`, source file reads |

`SKILL_ROOT` is the directory containing SKILL.md. All `bun tools/` commands must be run from here.

`PROJECT_ROOT` is the user's current working directory when the skill is invoked. All `.riviere/` artifacts (config, work files, graph) live here. **Record this value at the start of the session** — it is passed to every tool via `--project-root`.

`REPO_ROOT` is the root of each repository being analyzed. Use absolute paths when referencing source files in subagent instructions and step prompts.

When a step says "run from skill root", use `SKILL_ROOT`. When scanning source code, resolve against `REPO_ROOT`. When reading/writing `.riviere/` files or invoking tools, use `PROJECT_ROOT`.

## Verify

```bash
echo "=== extract-architecture prerequisites ===" && \
  (npx riviere --version > /dev/null 2>&1 && echo "PASS  riviere-cli" || echo "FAIL  riviere-cli — run: npm install -g @living-architecture/riviere-cli") && \
  (bun --version > /dev/null 2>&1 && echo "PASS  bun" || echo "FAIL  bun — install at https://bun.sh") && \
  (ls SKILL.md > /dev/null 2>&1 && echo "PASS  working directory" || echo "FAIL  working directory — cd to the skill root (directory containing SKILL.md)") && \
  (ls tools/init-graph.ts tools/validate-graph.ts tools/ingest-wiki.ts tools/generate-link-candidates.ts tools/replay-staged-links.ts tools/replay-staged-enrichments.ts tools/replay-staged-components.ts tools/split-checklist.ts tools/merge-domains.ts tools/check-hash.ts > /dev/null 2>&1 && echo "PASS  tools/" || echo "FAIL  tools/ — one or more tool files missing") && \
  (ls ../../cookbook/riviere/cli.md ../../cookbook/qmd/cli.md > /dev/null 2>&1 && echo "PASS  cookbooks" || echo "FAIL  cookbooks — ../../cookbook/riviere/cli.md or ../../cookbook/qmd/cli.md missing") && \
  ([ -f "SKILL.md" ] && echo "PASS  skill root (SKILL.md found in current directory)" || echo "FAIL  skill root — run this script from the extract-architecture/ directory containing SKILL.md")
```

All six lines must show PASS before continuing.

## Check Existing State

If `.riviere/` already exists from a previous run, check whether the source repositories have changed before proceeding:

```bash
if [ -d "$PROJECT_ROOT/.riviere" ]; then bun tools/check-hash.ts --project-root "$PROJECT_ROOT"; fi
```

Act on the exit code:

| Exit Code | Meaning                                          | Action                                                                                                                                                                                                                |
| --------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0` FRESH | All source repos unchanged since last extraction | Ask the user: **query the existing graph** (no re-extraction needed) or **re-extract anyway** (e.g. extraction rules changed). Stop here if they choose to query.                                                     |
| `1` STALE | One or more repos have new commits               | Inform the user which repos changed. Recommend re-running from **Step 3 (Extract)** if only code changed, or from **Step 1 (Explore)** if domain boundaries may have shifted. Ask for confirmation before proceeding. |
| `2` NEW   | No hash stored (first run, or hash was deleted)  | Proceed normally — no prior extraction to worry about.                                                                                                                                                                |

> **Single-repo vs multi-repo:** The check covers all repositories discovered in the previous run. A single-repo extraction stores one entry; a multi-repo extraction stores one entry per repo. Both cases use the same command.

## Initialize Workspace

```bash
mkdir -p "$PROJECT_ROOT/.riviere/work" "$PROJECT_ROOT/.riviere/config"
```

> **Directory note:** `.riviere/` is created inside `PROJECT_ROOT` (the user's project directory). All step files read and write `.riviere/` files there. All `bun tools/*.ts` invocations must include `--project-root "$PROJECT_ROOT"`. When spawning subagents to scan source code, pass `REPO_ROOT` as an absolute path explicitly.

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

## Record Progress

```bash
bun tools/detect-phase.ts --project-root "$PROJECT_ROOT" --step setup --status completed
```

## Completion

All checks PASS and workspace initialized. Proceed to `steps/explore-orchestrator.md`.
