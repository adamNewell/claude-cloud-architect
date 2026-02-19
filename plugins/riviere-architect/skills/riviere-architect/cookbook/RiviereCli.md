# Cookbook: riviere-cli

Index for `@living-architecture/riviere-cli` command reference.

## Installation

```bash
npm install @living-architecture/riviere-cli
# or use directly
npx riviere <command>
```

## Command Groups

```bash
riviere builder <command>   # build / modify the graph  → cookbook/RiviereBuilder.md
riviere query <command>     # read / query the graph    → cookbook/RiviereQuery.md
riviere extract <command>   # extract components        → cookbook/RiviereExtract.md
```

## Exit Codes

- `0` — Success (including warnings)
- `1` — Error or failed validation
- `2` — Validation hook found errors (Claude stops and fixes before continuing)

## Phase Mapping Quick Reference

| Phase              | Commands                                                                                       | Cookbook            |
| ------------------ | ---------------------------------------------------------------------------------------------- | ------------------- |
| Phase 3 — Extract  | `init`, `add-source`, `add-domain`, `define-custom-type`, `add-component`, `component-summary` | `RiviereBuilder.md` |
| Phase 4 — Link     | `component-checklist`, `link`, `link-http`, `link-external`                                    | `RiviereBuilder.md` |
| Phase 5 — Enrich   | `component-checklist --type DomainOp`, `enrich`                                                | `RiviereBuilder.md` |
| Phase 6 — Validate | `check-consistency`, `validate`, `finalize`                                                    | `RiviereBuilder.md` |
| Any phase          | `query domains`, `query components`, `query trace`, `query orphans`                            | `RiviereQuery.md`   |

## Concurrency Rules

| Command         | Concurrent? | Notes                                          |
| --------------- | ----------- | ---------------------------------------------- |
| `add-component` | No          | Verified: race condition causes data loss      |
| `enrich`        | No          | Verified: 45–60% data loss observed in testing |
| `link`          | Yes         | Safe: small sequential appends                 |
| `query *`       | Yes         | Read-only, always safe                         |
