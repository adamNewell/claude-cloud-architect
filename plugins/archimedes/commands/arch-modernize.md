---
model: opus
description: Full-scope autonomous modernization assessment — map services, trace flows, assess technical debt, identify migration candidates, and produce a prioritized modernization roadmap. Autonomous multi-step workflow with mandatory human review gates. USE WHEN conducting a comprehensive architecture assessment for modernization planning.
argument-hint: <repo-paths...> [--session <id>] [--time-limit <minutes>] [--skip-semantic] [--iac-repos <paths>]
---

# Arch Modernize

Full autonomous modernization assessment. Runs all 6 phases of the arch-modernize skill and produces 5 client-deliverable reports.

## Variables

```
REPO_PATHS:      from $ARGUMENTS — space-separated repo paths. Required.
SESSION:         from $ARGUMENTS — --session <id>. Auto-generated if not provided.
TIME_LIMIT:      from $ARGUMENTS — --time-limit <minutes>. Default: 60.
SKIP_SEMANTIC:   from $ARGUMENTS — --skip-semantic. Skip ColGREP indexing.
IAC_REPOS:       from $ARGUMENTS — --iac-repos <paths>. IaC repos to scan first (highest priority).
```

## Guardrails (MANDATORY — READ BEFORE PROCEEDING)

**These guardrails MUST be enforced throughout execution:**

1. **Repo scope:** Only analyze repos registered at session initialization. Never access repos outside the registered scope.
2. **Write gate:** Only write CANDIDATE and MACHINE-weight tags autonomously. PROMOTED status requires human review via `/arch-tag promote`.
3. **Uncertainty reporting:** Conflicting evidence is surfaced explicitly — never suppressed or silently averaged.
4. **Time bound:** Stop all analysis at TIME_LIMIT minutes. Report what was completed and what was skipped.
5. **Confidence transparency:** Every recommendation must include its tag ID(s) and confidence level(s).
6. **Human review gate:** After Phase 5, stop and present the CANDIDATE tag review before generating final reports.

## Load Skill

```
skills/arch-modernize/SKILL.md
```

The skill documentation contains the full phase instructions. Execute each phase by reading its step file.

## Phase Execution

### Phase 0: Session Initialization

Read and execute: `skills/arch-modernize/steps/session-init.md`

Parse IaC repos FIRST (highest confidence scaffold). Then register all repos.

### Phase 1: Structural Scan

Read and execute: `skills/arch-modernize/steps/structure-scan.md`

Spawn one structure-agent per repo in parallel.

### Phase 2: Semantic Indexing

Read and execute: `skills/arch-modernize/steps/semantic-search.md`

Skip if --skip-semantic. Spawn search-agent + docs-agent per repo.

### Phase 3: Agentic Exploration

Read and execute: `skills/arch-modernize/steps/agentic-explore.md`

Spawn observe-agent per repo. Build cross-repo connections.

### Phase 4: Flow Synthesis

Read and execute: `skills/arch-modernize/steps/flow-synthesis.md`

Use all accumulated tags as scaffold. Spawn flow-agent.

### Human Review Gate

**STOP HERE.** Present findings to the user before generating reports.

Show:
- Tag count by kind and status
- Top 10 highest-confidence CANDIDATE findings
- Any conflicting evidence found

Ask the user: "Review CANDIDATE findings now, or proceed directly to report generation?"

Use `/arch-tag promote` workflow if they want to review.

### Phase 5: Report Generation

Read and execute: `skills/arch-modernize/steps/report-generate.md`

Generate all 5 deliverables via `tools/report-generate.ts`.

## Output

After all phases complete:

```
# Modernization Assessment Complete
Session: {session-id}
Duration: {elapsed} minutes of {time-limit} allotted

## Tag Store Summary
Total findings: {total}
  Validated (deterministic): {n}
  Candidate (needs review): {n}
  Promoted (human-reviewed): {n}

## Deliverables Generated
1. .archimedes/reports/architecture-map.md
2. .archimedes/reports/service-profiles.md
3. .archimedes/reports/debt-assessment.md
4. .archimedes/reports/modernization-roadmap.md
5. .archimedes/sessions/{session-id}/tags.db (portable tag store)

## Next Steps
- Review CANDIDATE findings: `/arch-tag promote --session {session-id}`
- Export JSON: `/arch-tag export --session {session-id} --format json`
- Ask questions: `/arch-investigate "<question>" --repos {repo-paths}`
```
