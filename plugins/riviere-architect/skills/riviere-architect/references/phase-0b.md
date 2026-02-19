# Phase 0B — Register Wiki via qmd

## Objective

Index the project's wiki or documentation in `qmd` so it can be searched in later phases.

> **Command reference:** Load `Cookbook/Qmd.md` for full qmd syntax (install, collection setup, embed commands).

## Setup

Run the ingest tool from the skill's `Tools/` directory:

```bash
bun Tools/ingest-wiki.ts <path-or-url> [collection-name]
```

The tool detects the shape of WIKI_DATA automatically:

| Input                                  | Shape       | Behaviour                                          |
| -------------------------------------- | ----------- | -------------------------------------------------- |
| `./wiki/`                              | directory   | Indexed as one collection                          |
| `./README.md`                          | single-file | Copied into `./wiki/`, then indexed                |
| `./wikis/` *(subfolders = repo wikis)* | multi-wiki  | Each subdirectory becomes its own named collection |
| `https://github.com/org/repo.wiki.git` | git-url     | Cloned to `./wiki/`, then indexed                  |

Runs `--help` for full options. Calls `qmd collection add`, `qmd context add`, and `qmd embed` automatically.

## Completion

qmd is indexed and embeddings are generated. The collection is ready to query.

**Phase 0B complete.**

## Next Phase

Read `references/phase-1.md`
