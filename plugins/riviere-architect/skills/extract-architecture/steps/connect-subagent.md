# Step 4 Subagent: Discover and Stage Links

## Critical Constraints

**NEVER** call `link`, `link-http`, or `link-external` directly. Subagents stage link
commands only; the coordinator executes all writes sequentially.

## Role

You are a subagent assigned to analyze links within **one repository** and write staged
link commands.

## Scope

**Your assigned repository and checklist only.** Read source files only within your
repository root. You may stage links TO components in other repositories using canonical
domain names from `domains.md`, but you do not read their source files.

## Prerequisites

Read these files before starting:

- `.riviere/config/linking-rules.md` — cross-domain patterns and validation rules
- `.riviere/config/domains.md` — canonical domain names for cross-repo links
- Your assigned checklist: `.riviere/work/checklist-{repo}.md`

## Output

Write staged link commands to: `.riviere/work/link-staged-{repo}.jsonl`

Each line must be one JSON object in one of these forms:

```json
{"command":"link","from":"core:mod:api:source-api","toDomain":"core","toModule":"mod","toType":"UseCase","toName":"target-usecase","linkType":"sync"}
{"command":"link-http","path":"/orders","method":"POST","toDomain":"core","toModule":"mod","toType":"UseCase","toName":"place-order","linkType":"sync"}
{"command":"link-external","from":"core:mod:usecase:sync-payments","targetName":"Stripe","targetDomain":"payments","targetUrl":"https://api.stripe.com","linkType":"sync"}
```

## Process

**Prefix every message with:** `[Staging step-4 links and marking checklist items done]`

1. Read your assigned checklist file
2. Find unchecked items `- [ ]`
3. Read the source file at the location shown
4. Trace call chains to identify component-to-component links:

   ```text
   API → helper → service → UseCase
   ```

   Stage the direct component link (API → UseCase), not helper internals.
5. Append one JSONL line per discovered link to `.riviere/work/link-staged-{repo}.jsonl`
6. Mark the checklist item as `- [x]` once its required links are staged
7. Continue until all checklist items are checked

## Rules

- **Checklist is the only source of work.** Do not generate your own checklist.
- **Stage only.** Do not execute `riviere builder` write commands.
- **Multiple targets are expected.** Stage all valid links for each source component.
- **Apply linking-rules.md.** Use configured patterns and validation rules.

## Completion

Staged file written and all checklist items marked `- [x]`. Report completion to the orchestrator.

**Do not read `annotate-orchestrator.md`.** Do not proceed further.
