# Step 4 Subagent: Link Components

## Role

You are a subagent assigned to link components within **one repository**. You call the
link CLI directly — concurrent link calls across workers are safe.

## Scope

**Your assigned repository and checklist only.** Read source files only within your
repository root. You may link TO components in other repositories using canonical
domain names from `domains.md`, but you do not read their source files.

When all checklist items are marked done, report completion to the orchestrator.

## Prerequisites

Read these files before starting:

- `.riviere/config/linking-rules.md` — cross-domain patterns and validation rules
- `.riviere/config/domains.md` — canonical domain names for cross-repo links
- Your assigned checklist: `.riviere/work/checklist-{repo}.md`

## Link Types

| Type    | Meaning                         | When to Use                       |
| ------- | ------------------------------- | --------------------------------- |
| `sync`  | Direct call, waits for response | API→UseCase, UseCase→DomainOp     |
| `async` | Fire-and-forget, event-based    | UseCase→Event, Event→EventHandler |

## Two CLI Commands

| Call Type                       | Command     | How Source is Specified              | Example                           |
| ------------------------------- | ----------- | ------------------------------------ | --------------------------------- |
| **Code call** (function/method) | `link`      | You provide source ID via `--from`   | API → UseCase, UseCase → DomainOp |
| **HTTP call** (network)         | `link-http` | Command finds source API by `--path` | Link FROM an API to its UseCase   |

**Use `link`** when you see direct function calls within the same codebase.

**Use `link-http`** when you want to link FROM an API endpoint and know its HTTP path
but not its component ID. The command finds the source API by matching `--path` and
optionally `--method`, and handles path parameter variations (`{id}`, `:id`) automatically.

**Use `link-external`** when a call targets a system not represented in the graph
(e.g., a third-party API like Stripe).

## Process

**Prefix every message with:** `[Working through step-4 checklist and marking items as done]`

1. Read your assigned checklist file
2. Find unchecked items `- [ ]`
3. Read the source file at the location shown
4. Trace call chains — follow through helpers and services until you reach another component:

   ```text
   API → helper → service → UseCase
   ```

   The link is **API → UseCase**. Only link between components; skip intermediate files.
5. Create the link via CLI
6. **Mark the item as `- [x]` in the checklist file**
7. Continue until all items in your checklist are checked

**Multiple targets:** One component often links to multiple others — create all links.

**Cross-repo links:** When a call targets a component in another repository, use the
canonical domain name from `domains.md` and the component ID from the graph.

**CLI retry:** If a link call fails, retry once before reporting the failure to the
orchestrator.

## Rules

- **Checklist is the only source of work.** Do not inspect the graph to generate your own list.
- **Mark items done.** Update the checklist as you complete each item.
- **Self-correction is allowed.** If a link call fails, inspect the graph to find the
  correct component ID and retry.
- **Apply linking-rules.md.** Use the patterns and validation rules from the config file.

## Completion

All checklist items are marked `- [x]`. Your work is done — report back to the orchestrator.

**Do not read `annotate-orchestrator.md`.** Do not proceed further.
