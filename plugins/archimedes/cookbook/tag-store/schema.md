# Tag Store Schema Reference

The tag store is a SQLite database at `.archimedes/sessions/<session_id>/tags.db`.
All writes use `bun run tools/tag-store.ts` (or the `tag-store` tool in Claude Code).

---

## Column Reference

| Column | Type | Default | Description | Example Value |
|--------|------|---------|-------------|---------------|
| `id` | TEXT PK | UUID | Auto-generated UUID for each tag | `"a3f2c1d0-..."` |
| `target_type` | TEXT | `'FILE'` | What kind of artifact this tag describes | `FILE` |
| `target_ref` | TEXT | (required) | Path, URL, or identifier of the artifact | `"src/handlers/user.ts"` |
| `target_repo` | TEXT | (required) | Absolute path to the repository root | `"/home/user/my-service"` |
| `kind` | TEXT | (required) | Tag taxonomy bucket (see Kind Reference below) | `PATTERN` |
| `value` | TEXT | `'{}'` | JSON blob with tool-specific structured data | `{"pattern_name":"aws-lambda-handler-esm","subkind":"lambda-handler","line":1}` |
| `confidence` | REAL | `0.5` | Certainty score 0.0–1.0 (see Confidence Gradient) | `0.95` |
| `weight_class` | TEXT | `'MACHINE'` | Origin authority class (see Weight Classes) | `MACHINE` |
| `source_tool` | TEXT | (required) | Tool that produced this tag | `ast-grep` |
| `source_query` | TEXT | NULL | Rule ID or query string used to find this tag | `"aws-lambda-handler-esm"` |
| `source_evidence` | TEXT | NULL | Raw matched text or snippet supporting the tag | `"export const handler = async (event, ctx) => {"` |
| `status` | TEXT | `'CANDIDATE'` | Lifecycle state (see Tag Lifecycle) | `CANDIDATE` |
| `parent_tag_id` | TEXT | NULL | ID of a parent tag (for hierarchical grouping) | `"b1e9a2f0-..."` |
| `related_tags` | TEXT | `'[]'` | JSON array of related tag IDs | `["c3d1...","d4e2..."]` |
| `session_id` | TEXT | (required) | Session identifier that produced this tag | `"session-2024-01-15-abc123"` |
| `created_at` | TEXT | (required) | ISO 8601 creation timestamp | `"2024-01-15T10:30:00.000Z"` |
| `updated_at` | TEXT | (required) | ISO 8601 last-updated timestamp | `"2024-01-15T10:30:00.000Z"` |
| `validated_by` | TEXT | NULL | Agent or user identifier who validated this tag | `"human:adam"` |

### Unique Deduplication Index

```sql
UNIQUE INDEX ON tags(target_ref, kind, source_tool, session_id)
```

On conflict, the existing row is updated: `updated_at` is refreshed and `confidence` is raised to the higher of the two values. This means re-scanning a file only strengthens confidence — it never creates a duplicate.

---

## Tag Lifecycle

Tags move through states as they are reviewed and promoted by agents or humans.

```
CANDIDATE --> VALIDATED --> PROMOTED
    |              |
    v              v
REJECTED        STALE
```

| State | Meaning |
|-------|---------|
| `CANDIDATE` | Newly written by a tool. Not yet reviewed. Default starting state for `MACHINE` tags. |
| `VALIDATED` | Reviewed and confirmed accurate. `HUMAN` weight tags start here automatically. |
| `PROMOTED` | Elevated to authoritative fact; `weight_class` is also set to `PROMOTED`. Used for cross-session or cross-agent sharing. |
| `REJECTED` | Confirmed incorrect or irrelevant. Excluded from most queries by convention (`status != 'REJECTED'`). |
| `STALE` | Previously valid but now outdated (e.g. after a file was deleted or refactored). |

Transitions are performed via:
- `tag-store promote --tag-id <id>` — sets `status=PROMOTED, weight_class=PROMOTED`
- `tag-store reject --tag-id <id>` — sets `status=REJECTED`
- `tag-store write` — always starts as `CANDIDATE` (or `VALIDATED` if `weight_class=HUMAN`)

---

## Weight Classes

| Weight Class | Authority | Starting Status | Description |
|--------------|-----------|-----------------|-------------|
| `HUMAN` | Deterministic / declarative | `VALIDATED` | Sourced from a config file, IaC declaration, or explicit human annotation. Treated as ground truth — no review needed. |
| `MACHINE` | Probabilistic / inferred | `CANDIDATE` | Produced by pattern matching, semantic similarity, or heuristic analysis. Requires review before promotion. |
| `PROMOTED` | Machine reviewed by human | `PROMOTED` | A `MACHINE` tag that was reviewed and elevated. Effectively equivalent to `HUMAN` for querying purposes. |

The `weight_class` field is set automatically by `tag-store write` based on the `--weight` flag. The `write-from-ast-grep` command reads `weight_class` from the `archimedes:` block in the rule file.

---

## Confidence Gradient

Confidence reflects how certain the tagging source is about the observation. Values are 0.0–1.0.

| Source Type | Confidence Range | Rationale |
|-------------|-----------------|-----------|
| IaC declarations (CloudFormation, Terraform) | `0.95` | Declarative configuration is authoritative and unambiguous. |
| Docker / Kubernetes / service mesh configs | `0.85` | Structured config files; minor parsing ambiguity possible. |
| Direct code import and instantiation | `0.80–0.90` | High certainty, but language quirks can introduce false positives. |
| Code usage patterns (SDK calls, API routes) | `0.70–0.80` | Pattern matching is reliable but context-dependent. |
| Debt/risk heuristics (anti-patterns) | `0.70–0.85` | Rule-based; can have false positives depending on context. |
| Documentation references | `0.60` | Prose is ambiguous; documentation may be outdated. |
| Semantic similarity (ColGREP) | `0.50` | Embedding-based; inherently probabilistic. |

---

## Kind Reference

| Kind | Description | Typical `subkind` Values |
|------|-------------|--------------------------|
| `PATTERN` | A structural or architectural pattern found in code or config. | `lambda-handler`, `http-route-handler`, `event-emitter`, `repository-class`, `service-class` |
| `DEPENDENCY` | An external library, SDK, or service dependency. | `npm-package`, `aws-sdk`, `http-client`, `orm` |
| `CAPABILITY` | A functional capability the system provides or consumes. | `rest-api`, `event-bus`, `message-queue`, `data-store` |
| `ROLE` | The architectural role a component plays in the system. | `api-gateway`, `worker`, `scheduler`, `orchestrator` |
| `FLOW` | A data or control flow between components. | `request-response`, `event-driven`, `batch-pipeline` |
| `DEBT` | A technical debt observation — something that should be fixed. | `hardcoded-credential`, `dynamodb-full-scan`, `lambda-cold-start-risk`, `wildcard-topic` |
| `RISK` | A security, reliability, or operational risk. | `exposed-secret`, `missing-error-handling`, `unbounded-retry` |

---

## `value` JSON Conventions

The `value` column is a free-form JSON blob. For tags written by `write-from-ast-grep`, the structure is:

```json
{
  "pattern_name": "<rule id>",
  "subkind": "<archimedes.subkind from rule>",
  "rule_id": "<ast-grep ruleId from match>",
  "line": 12,
  "column": 0,
  "language": "TypeScript"
}
```

For manually written tags, use whatever JSON structure is meaningful for the `kind`. For `DEBT` and `RISK` tags, include a `note` field with a human-readable explanation:

```json
{
  "subkind": "dynamodb-full-scan",
  "note": "DynamoDB Scan reads entire table — expensive at scale, replace with Query + GSI"
}
```
