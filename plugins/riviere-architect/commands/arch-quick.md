---
model: opus
description: Quick architecture pre-flight — Bash/Glob/Grep based scan of one repository. Produces a 1-page summary with Mermaid diagram in under 10 minutes, no external CLIs required. USE WHEN you want a fast architectural overview before deciding whether to run the full arch-deconstruct workflow, or when you just need the lay of the land.
argument-hint: <repo-path> [--save=<output-file>]
---

# Arch Quick

## Purpose

Lightweight architecture scan using only Bash, Glob, Grep, and Read. No riviere CLI, no qmd, no external dependencies. Produces a 1-page summary sufficient to:
- Understand the tech stack and primary pattern
- Identify entry points and key components
- Decide if the full arch-deconstruct workflow is needed
- Orient a new team member in under 15 minutes of reading

## Variables

```
REPO_PATH:  from $ARGUMENTS — first argument. Required.
SAVE_PATH:  from $ARGUMENTS — `--save=<path>` if present. Default: print only.
```

## Instructions

Execute the scan directly in this context — no subagents. Speed is the goal.

**Hard time budget: 10 minutes total.** If approaching 10 minutes, truncate remaining steps and generate report from available data.

## Workflow

### Step 1: Identity (60 seconds)

```bash
# Manifest
cat {REPO_PATH}/package.json 2>/dev/null | head -40
cat {REPO_PATH}/pyproject.toml 2>/dev/null | head -40
cat {REPO_PATH}/go.mod 2>/dev/null | head -20
cat {REPO_PATH}/Cargo.toml 2>/dev/null | head -20

# README
head -80 {REPO_PATH}/README.md 2>/dev/null

# Top-level structure
ls -la {REPO_PATH}/
find {REPO_PATH} -maxdepth 2 -type d -not -path '*/.git/*' -not -path '*/node_modules/*' -not -path '*/__pycache__/*' | sort
```

### Step 2: Entry Points (45 seconds)

```bash
find {REPO_PATH} -maxdepth 3 -name "main.*" -o -name "index.*" -o -name "app.*" -o -name "server.*" 2>/dev/null \
  | grep -v node_modules | grep -v .git | head -8

# Check for riviere config (if riviere-architect was run before)
ls {REPO_PATH}/.riviere/config/ 2>/dev/null
```

### Step 3: Tech Stack Detection (45 seconds)

```bash
# File type counts
find {REPO_PATH} -type f \
  -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/__pycache__/*' \
  | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -15

# Key dependencies
cat {REPO_PATH}/package.json 2>/dev/null \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print('\n'.join(list(d.get('dependencies',{}).keys())[:15]))" 2>/dev/null
```

### Step 4: Pattern Detection (60 seconds)

```bash
# Layered architecture signals
find {REPO_PATH}/src {REPO_PATH}/lib {REPO_PATH} -maxdepth 3 -type d 2>/dev/null \
  | grep -iE "controller|service|repo|repository|handler|middleware|model|route|domain|usecase|event" \
  | grep -v node_modules | head -20

# Monorepo signals
ls {REPO_PATH}/packages {REPO_PATH}/apps 2>/dev/null

# CI/Docker
ls {REPO_PATH}/.github/workflows/ 2>/dev/null | head -5
ls {REPO_PATH}/Dockerfile {REPO_PATH}/docker-compose.yml 2>/dev/null
```

### Step 5: Key External Dependencies (30 seconds)

From the manifest, classify the top 10 dependencies by role:
- **Web framework:** express / fastapi / gin / axum / koa
- **Database:** prisma / drizzle / sqlalchemy / gorm
- **Auth:** clerk / jose / passport
- **AI/LLM:** anthropic / openai / langchain
- **Queue:** bull / kafka / amqp
- **Testing:** jest / vitest / pytest

### Step 6: Generate Report

Write the report in this format:

```markdown
# Architecture Quick Scan: {repo-name}

**Path:** {REPO_PATH}
**Scanned:** {timestamp}

---

## At a Glance

| Signal        | Value                              |
|---------------|------------------------------------|
| Language      | {primary language}                 |
| Runtime       | {runtime}                          |
| Framework     | {framework or "none detected"}     |
| Database      | {db or "none detected"}            |
| Source files  | ~{count}                           |
| Architecture  | {pattern name}                     |

---

## Architecture Pattern

**{Primary Pattern}** ({HIGH|MEDIUM|LOW} confidence)

{2-3 sentences: what the pattern is, how layers are organized, primary data path}

---

## Directory Structure (key dirs only)

{REPO_PATH}/
{significant directories with one-line roles}

---

## Entry Points

{list: file path — what it starts}

---

## Key Dependencies

| Category | Package    | Role    |
|----------|------------|---------|
| Web      | {package}  | HTTP routing |
| Database | {package}  | {role}  |
{more rows as needed}

---

## One-Page Diagram

(max 12 nodes)

```mermaid
graph TD
  {concise system overview}
```

---

## Recommendation

{One of:}
- **Run `/arch-deconstruct {REPO_PATH}`** — codebase complexity justifies full 6-phase riviere extraction
- **Run `/arch-deconstruct {REPO_PATH} --skip-wiki --skip-enrich`** — moderate complexity; skip optional phases
- **This scan is sufficient** — small/simple codebase; full extraction may be overkill

---

*For full architecture extraction: `/arch-deconstruct {REPO_PATH}`*
```

If SAVE_PATH provided: write report to that path. Otherwise print to conversation.

## Report

See Step 6 above.

## Examples

### Quick scan of current directory
```
/arch-quick .
```

### Scan a specific repo and save results
```
/arch-quick /projects/my-api --save=./arch-summary.md
```
