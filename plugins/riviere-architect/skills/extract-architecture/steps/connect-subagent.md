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

## Link Type Decision Matrix

When tracing a dependency, use this table to choose the correct command:

| Scenario                                                                                                                         | Command         | Example                                          |
| -------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------ |
| **Internal Code Reference** (Same Repo)<br>Direct import, function call, class usage.                                            | `link`          | `UserService` imports `UserRepository`           |
| **Internal HTTP Call** (Same or Different Repo)<br>Call to an API endpoint managed within this system (even if in another repo). | `link-http`     | `Frontend` calls `POST /api/users`               |
| **External System Call**<br>Call to a third-party API (Stripe, AWS, Twilio) or a system outside the graph scope.                 | `link-external` | `PaymentService` calls `https://api.stripe.com`  |
| **Message/Event Publication**<br>Publishing to a queue or topic (target is the Event component).                                 | `link`          | `OrderService` publishes to `OrderCreated` event |

**Note on HTTP:** If you see an HTTP client wrapper (e.g., `UserApiClient`) calling an endpoint, link the *caller* (e.g., `OrderUseCase`) to the *endpoint* (`POST /users`) using `link-http`. Do not link the client wrapper itself unless it has significant logic.

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
