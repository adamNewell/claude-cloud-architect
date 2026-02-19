# Wiki Build — Generate Wiki (Optional)

## Objective

Generate markdown wiki content for each target repository so Step `wiki-index` can ingest it into qmd.

## Decision Gate

Run this step only when:

- User wants wiki generation, and
- `WIKI_DATA` is not already a usable docs/wiki path or `.wiki.git` URL.

If a valid wiki path already exists, skip directly to `steps/wiki-index.md`.

## Prerequisites

- DeepWiki Open is available (follow upstream setup docs: [AsyncFuncAI/deepwiki-open](https://github.com/AsyncFuncAI/deepwiki-open))
- At least one provider key is configured (`GOOGLE_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`) or local Ollama is available
- Output layout is chosen before generation:
  - Single repo: `./wiki/`
  - Multi-repo: `./wikis/<repo>/`

## Workflow

1. Start DeepWiki Open (Docker or manual setup per upstream docs).
2. Generate wiki content for each target repository.
3. Export markdown locally:
   - Typical local cache path: `~/.deepwiki/generated/{owner}/{repo}/`
   - Docker deployments commonly write under `/data/output/`
   - If a repo already has a GitHub wiki, cloning `<repo>.wiki.git` is acceptable instead of generation
4. Verify export before continuing:

```bash
find wiki wikis -type f -name '*.md' 2>/dev/null | head
find wiki wikis -type f -name '*.md' 2>/dev/null | wc -l
```

At least one markdown file must exist per wiki.

5. Report exported wiki path(s), then proceed to `steps/wiki-index.md`.

## Failure Recovery

- **Generation/auth failure:** report exact provider/auth error and stop; do not continue with empty output.
- **Export path empty:** re-check `{owner}/{repo}` path mapping and re-export before indexing.
- **Service unavailable:** skip this step only with explicit user approval and only if an alternate wiki/docs path exists.

## Next Phase

Read `steps/wiki-index.md`
