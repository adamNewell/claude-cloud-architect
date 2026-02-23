---
model: opus
description: Generate a comprehensive service profile for one or more repositories — API surface, dependencies, role classifications, technology patterns, and tagged findings. USE WHEN assessing a specific repository or set of repositories to understand their architecture, dependencies, and technical health.
argument-hint: <repo-path-or-paths...> [--session <id>] [--skip-semantic] [--iac-only]
---

# Arch Assess

Single-repo or multi-repo service assessment. Runs the structure → search → observe pipeline and produces a structured service profile for each repository.

## Variables

```
REPO_PATHS:      from $ARGUMENTS — space-separated repo paths. Required.
SESSION:         from $ARGUMENTS — --session <id>. Auto-generated if not provided.
SKIP_SEMANTIC:   from $ARGUMENTS — --skip-semantic flag. Skip ColGREP indexing (faster).
IAC_ONLY:        from $ARGUMENTS — --iac-only flag. Only scan IaC files.
RUN_ID:          8-char UUID generated at start.
```

## Codebase Structure

All output goes to:
```
.archimedes/
└── sessions/{session-id}/
    ├── tags.db           ← SQLite tag store (all findings)
    └── meta.json         ← Session metadata
```

## Pipeline

### Phase 0: Session Initialization

If SESSION not provided, generate one:
```bash
SESSION=$(uuidgen | tr '[:upper:]' '[:lower:]' 2>/dev/null || python3 -c "import uuid; print(uuid.uuid4())")
```

Initialize the session:
```bash
bun tools/session-init.ts --session ${SESSION} --repos "${REPO_PATHS}"
```

Report: "Session ${SESSION} initialized. Repos: ${REPO_PATHS}"

### Phase 1: Structural Analysis (Per Repo)

For each repo in REPO_PATHS, spawn one structure agent:

```
AGENT: Read agents/structure-agent.md for agent instructions.
TASK: Run arch-structure skill against REPO=${path} for SESSION=${SESSION}.
EFFORT: Return within 90 seconds per repo.
```

Spawn one agent per repo. Wait for all to complete before proceeding.

Read the skill instructions for this phase:
```
skills/arch-structure/SKILL.md
```

### Phase 2: Semantic Analysis (Per Repo, unless --skip-semantic)

For each repo, spawn one search agent + one docs agent:

```
SEARCH AGENT: Read agents/search-agent.md. Run arch-search for REPO=${path}, SESSION=${SESSION}.
DOCS AGENT: Read agents/docs-agent.md. Run arch-docs for REPO=${path}, SESSION=${SESSION}.
EFFORT: 90 seconds each.
```

Skip this phase if --skip-semantic or --iac-only is set.

### Phase 3: Role Classification (Per Repo)

For each repo, spawn one observe agent:

```
OBSERVE AGENT: Read agents/observe-agent.md. Run arch-observe for REPO=${path}, SESSION=${SESSION}.
EFFORT: 60 seconds per repo.
```

### Phase 4: Generate Assessment Report

Query the tag store and produce the service profile:

```bash
# Summary statistics
bun tools/tag-store.ts query "SELECT kind, COUNT(*) as count, AVG(confidence) as avg_conf FROM tags WHERE status != 'REJECTED' GROUP BY kind" --session ${SESSION}

# API surface (route handlers)
bun tools/tag-store.ts query "SELECT target_ref, target_repo, json_extract(value, '$.method') as method, json_extract(value, '$.path') as path FROM tags WHERE kind='PATTERN' AND json_extract(value, '$.pattern_name')='route-handler'" --session ${SESSION}

# Technology dependencies
bun tools/tag-store.ts query "SELECT DISTINCT json_extract(value, '$.target') as dependency, target_repo FROM tags WHERE kind='DEPENDENCY' AND weight_class='HUMAN'" --session ${SESSION}

# Role distribution
bun tools/tag-store.ts query "SELECT json_extract(value, '$.role') as role, COUNT(*) as count FROM tags WHERE kind='ROLE' GROUP BY role ORDER BY count DESC" --session ${SESSION}

# Debt findings
bun tools/tag-store.ts query "SELECT target_ref, json_extract(value, '$.category') as category, json_extract(value, '$.severity') as severity, confidence FROM tags WHERE kind='DEBT' ORDER BY confidence DESC LIMIT 20" --session ${SESSION}
```

### Phase 5: Output

Present the service profile per repo:

```
# Service Assessment: {repo-name}
Session: {session-id}
Date: {date}

## API Surface
{table of route handlers with method, path, confidence}

## Technology Stack
{table of detected dependencies}

## Component Roles
{ORCHESTRATION: N, DEFINITION: N, INTEGRATION: N, INFRASTRUCTURE: N}

## Technical Debt
{top 10 debt findings by confidence}

## Confidence Summary
{total tags, breakdown by weight class and status}

## Next Steps
- Review CANDIDATE findings: `/arch-tag promote --session {session-id}`
- Full modernization assessment: `/arch-modernize {repo-paths}`
- Export findings: `/arch-tag export --session {session-id} --format json`
```

## Notes

- Always use AGENT_TEAMS for multi-repo assessments (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)
- One agent per repo — never batch multiple repos in one agent
- Structural analysis (Phase 1) is always run; semantic (Phase 2) can be skipped with --skip-semantic
