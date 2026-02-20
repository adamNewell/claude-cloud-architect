# Discover Linked Repos (Conditional)

## Objective

Scan IaC files in provided repositories for references to other internal repositories. Present findings to the user for confirmation, then feed discovered repos into the Explore workflow.

**This step is conditional.** It only runs when IaC files (CDK, Terraform, CloudFormation/SAM, Pulumi) are detected in at least one provided repository. Non-IaC codebases skip this step entirely.

## Record Progress

```bash
bun tools/detect-phase.ts --project-root "$PROJECT_ROOT" --step discover --status started
```

## Prerequisites

- Setup step completed
- At least one repo path provided

## Step 1: Detect IaC Files

Quick check — do any provided repos contain IaC signals?

| Framework | Signal Files |
| ------------ | -------------------------------------------------------- |
| CDK | `cdk.json`, `cdk.context.json` |
| Terraform | `*.tf` files (top level or one level deep) |
| CloudFormation/SAM | `template.yaml` with `AWSTemplateFormatVersion` or `Transform: AWS::Serverless` |
| Pulumi | `Pulumi.yaml`, `Pulumi.yml` |

**If no IaC detected:** Skip this entire step. Proceed directly to `steps/explore-orchestrator.md`.

## Step 2: Ensure Config Exists

Check for `.riviere/config/repo-discovery.yaml`. If it doesn't exist, ask the user:

> "I detected IaC files and can scan for references to other internal repos. To filter for internal-only repos, I need some context:
>
> 1. What is your GitHub org name? (e.g., `my-company`)
> 2. What is your AWS account ID for ECR? (e.g., `123456789012`)
> 3. What is your npm scope for internal packages? (e.g., `@my-company`)
> 4. Any known repo name → local path mappings? (optional)"

Create the config:

```yaml
github_org: {user-provided}
ecr_account_id: {user-provided}
npm_scope: {user-provided}
known_repos:
  {optional mappings}
```

Write to `.riviere/config/repo-discovery.yaml`.

## Step 3: Run Discovery Tool

```bash
bun tools/discover-linked-repos.ts --project-root "$PROJECT_ROOT" {REPO_PATHS...}
```

Handle exit codes:

| Exit Code | Meaning | Action |
| --------- | ------- | ------ |
| `0` | Repos discovered | Continue to Step 4 |
| `1` | Config missing or invalid | Fix config, retry |
| `2` | No IaC files found | Skip discovery, proceed to Explore |

## Step 4: Present Findings to User

Read `.riviere/work/discovered-repos.json` and present:

> "I found these internal repos referenced from your IaC code:
>
> - **orders-api** (via ECR image in `ecs-stack.ts:42`)
> - **payment-lambda** (via CodeUri in `sam-template.yaml:15`)
> - **shared-lib** (via `@org/shared-lib` import)
>
> Should I include all of these in the architecture extraction?
>
> Repos not available locally are marked with `?` — you'll need to clone them to include them."

For repos with `"status": "not_cloned"`, provide clone commands:

```bash
git clone git@github.com:{org}/{repo-name}.git /path/to/sibling/{repo-name}
```

**User must confirm** which repos to include before proceeding.

## Step 5: Recursive Discovery (Conditional)

Check if any newly discovered repo with `"status": "available"` is itself an IaC repo.

If yes, re-run discovery on those repos with the `--already-visited` flag:

```bash
bun tools/discover-linked-repos.ts \
  --project-root "$PROJECT_ROOT" \
  --already-visited {comma-separated-already-scanned-repos} \
  {new-repo-paths...}
```

Repeat until one of these conditions is met:

- No new repos are discovered, OR
- All newly discovered repos are `"status": "not_cloned"`

Merge results: read the updated `discovered-repos.json` and present any new findings to the user.

## Step 6: Finalize

The final `discovered-repos.json` contains all confirmed repos. These will be picked up by `explore-orchestrator.md` and included in the Explore step.

## Record Completion

```bash
bun tools/detect-phase.ts --project-root "$PROJECT_ROOT" --step discover --status completed
```

## Output

- `.riviere/work/discovered-repos.json` — manifest of discovered repos
- `.riviere/config/repo-discovery.yaml` — org filtering config (if newly created)

## Completion

**Discovery complete.** Proceed to `steps/explore-orchestrator.md`.
