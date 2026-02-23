---
model: opus
description: Open-ended architectural investigation. Given a question or hypothesis, autonomously explore the codebase to find supporting and contradicting evidence. Time-bounded. Tags everything found. Explicitly surfaces conflicting evidence. USE WHEN you have a specific architectural question that needs investigation — "Why does service X depend on Y?", "Are there circular dependencies?", "Is the payment flow correctly isolated?"
argument-hint: "<question>" --repos <paths> [--session <id>] [--time-limit <minutes>]
---

# Arch Investigate

Open-ended investigation with a specific question. Combines all analysis tiers to find evidence, then synthesizes a balanced answer that explicitly surfaces conflicting findings.

## Variables

```
QUESTION:        from $ARGUMENTS — quoted question string. Required.
REPOS:           from $ARGUMENTS — --repos <paths>. Required.
SESSION:         from $ARGUMENTS — --session <id>. Auto-generated if not provided.
TIME_LIMIT:      from $ARGUMENTS — --time-limit <minutes>. Default: 30.
```

## Guardrails

1. **Conflicting evidence is mandatory:** Every investigation must explicitly present both supporting AND contradicting evidence. If you find no contradicting evidence, state that explicitly.
2. **Tag everything:** All evidence found during investigation must be written to the tag store, even evidence that contradicts the hypothesis.
3. **Time bound:** Stop at TIME_LIMIT minutes. Report partial findings with a clear statement of what was not investigated.
4. **Repo scope:** Only investigate registered/specified repos. Don't access external resources.

## Execution

### Step 1: Parse the Question

Decompose the question into:
- **Hypothesis:** What would be true if the answer is YES
- **Anti-hypothesis:** What would be true if the answer is NO
- **Evidence types needed:** Which tool layers can answer this? (structural, semantic, symbolic, docs)
- **Target files/symbols:** What specific code to examine

### Step 2: Initialize Session

```bash
SESSION=$(uuidgen | tr '[:upper:]' '[:lower:]' 2>/dev/null || python3 -c "import uuid; print(uuid.uuid4())")
bun tools/session-init.ts --session ${SESSION} --repos "${REPOS}"
```

### Step 3: Gather Evidence

Run evidence gathering in parallel where possible. Use the appropriate tool for each evidence type:

**Structural evidence (ast-grep):**
Read `skills/arch-structure/SKILL.md`. Run patterns relevant to the question.

**Symbolic evidence (Serena):**
Read `skills/arch-navigate/SKILL.md`. Use find_symbol and find_references for specific symbols in the question.

**Semantic evidence (ColGREP):**
Read `skills/arch-search/SKILL.md`. Run semantic queries derived from the question.

**Documentation evidence:**
Read `skills/arch-docs/SKILL.md`. Search docs for decisions related to the question.

**Role evidence (osgrep):**
Read `skills/arch-observe/SKILL.md`. Classify components relevant to the question.

### Step 4: Categorize Evidence

After gathering, sort findings into:
- **Supporting evidence:** Confirms the hypothesis
- **Contradicting evidence:** Contradicts the hypothesis
- **Neutral/context:** Relevant but not directly supporting or contradicting

Write ALL evidence to the tag store, including contradicting findings.

### Step 5: Synthesize Answer

Present a balanced answer with:

```
# Investigation: {QUESTION}
Session: {session-id}
Time: {elapsed} of {time-limit} minutes

## Hypothesis
{what would be true if YES}

## Evidence Found

### Supporting (n findings)
{list with confidence and source for each}

### Contradicting (n findings)
{list with confidence and source for each}

### Uncertain / Insufficient Evidence
{what couldn't be determined and why}

## Conclusion
{balanced 2-3 sentence conclusion}
Confidence: {0.0-1.0} — {rationale for this confidence level}

## Conflicting Evidence Summary
{explicit statement of the most significant conflict found, or "No significant conflicts found"}

## Tag Store Reference
Session: {session-id}
All findings: bun tools/tag-store.ts query "SELECT * FROM tags" --session {session-id}

## Next Steps
{1-3 specific follow-up actions or investigations}
```

### Step 6: Check for Conflicts

CRITICAL: Before presenting the conclusion, explicitly check if any supporting and contradicting evidence points to the same symbol or file. If so, flag it prominently.

## Example Questions

- "Does the payment service depend on the order service, or is it the other way around?"
- "Are there any circular dependencies between the API and worker services?"
- "Is the authentication logic duplicated across services?"
- "Does the IaC topology match what the code actually deploys?"
- "Are there any services that bypass the repository layer?"
