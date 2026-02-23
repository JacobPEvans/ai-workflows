# Getting Started

Add ai-workflows reusable workflows to your repository using thin caller files.

## Prerequisites

1. [GitHub CLI](https://cli.github.com/) installed and authenticated
2. Secrets configured in your repository:
   - `CLAUDE_CODE_OAUTH_TOKEN` — Claude Code OAuth token (required by all workflows)
   - `GH_CLAUDE_SSH_SIGNING_KEY` — SSH signing key for Claude commits (required by write workflows)

## How It Works

Each reusable workflow in this repo exposes `on: workflow_call`. You create a small "thin caller" file in your repo that calls it with `uses:`. The reusable workflow handles all the logic; you just provide triggers, secrets, and permissions.

## Thin Caller Template

```yaml
# .github/workflows/<name>.yml in your consumer repo
name: <Workflow Name>
on:
  <trigger>:
    types: [<event>]
permissions:
  contents: read           # minimum needed by this workflow
  id-token: write          # required for OIDC auth
  issues: write            # add what this workflow needs
jobs:
  run:
    uses: JacobPEvans/ai-workflows/.github/workflows/<name>.yml@v0.3.0
    secrets: inherit
```

**Important**: Consumer callers must declare `permissions:` explicitly. CodeQL and branch protection rules may block merges if permissions are missing.

---

## Available Workflows

### Event-Triggered Workflows

#### `issue-triage.yml`
Triggered by `issues: [opened]`. Categorizes, deduplicates, and labels new issues.

```yaml
on:
  issues:
    types: [opened]
permissions:
  contents: read
  id-token: write
  issues: write
```

#### `issue-resolver.yml`
Triggered by `issues: [opened]`. Creates draft PRs for simple, well-scoped issues.

```yaml
on:
  issues:
    types: [opened]
permissions:
  contents: write
  id-token: write
  issues: write
  pull-requests: write
```

Inputs: `repo_context` (required), `file_patterns` (optional)

#### `claude-review.yml`
Triggered by `pull_request`. Reviews PRs for quality and best practices.

```yaml
on:
  pull_request:
    types: [opened, synchronize, ready_for_review]
permissions:
  actions: read
  contents: read
  id-token: write
  issues: write
  pull-requests: write
```

#### `final-pr-review.yml`
Triggered by `pull_request_review`. Final review gate before merge.

```yaml
on:
  pull_request_review:
    types: [submitted]
permissions:
  checks: read
  contents: read
  id-token: write
  issues: write
  pull-requests: write
```

#### `ci-fix.yml`
Triggered by `workflow_run` with `conclusion: failure`. Analyzes CI failure logs and pushes fixes.

```yaml
on:
  workflow_run:
    workflows: ["CI"]    # name of your CI workflow
    types: [completed]
permissions:
  actions: read
  contents: write
  id-token: write
  issues: write
  pull-requests: write
```

Inputs: `repo_context` (required), `ci_structure` (required), `extra_tools` (optional)

#### `post-merge-docs-review.yml`
Triggered by `push: branches: [main]`. Reviews documentation after merges, creates fix PRs.

```yaml
on:
  push:
    branches: [main]
permissions:
  contents: write
  id-token: write
  pull-requests: write
```

#### `post-merge-tests.yml`
Triggered by `push: branches: [main]`. Analyzes merged code and creates draft PRs with tests.

```yaml
on:
  push:
    branches: [main]
permissions:
  contents: write
  id-token: write
  pull-requests: write
```

#### `project-router.yml`
Triggered by issue/PR events. Routes items to GitHub Projects.

```yaml
on:
  issues:
    types: [opened, labeled]
  pull_request:
    types: [opened, ready_for_review]
permissions:
  contents: read
  id-token: write
  issues: write
  pull-requests: read
```

---

### Scheduled Workflows

These are typically called with `schedule:` and `workflow_dispatch:`.

#### `best-practices.yml`
Weekly audit creating actionable recommendations. Gate: skips if no recent human activity.

```yaml
on:
  schedule:
    - cron: "0 3 * * 3"    # Wed 3am UTC
  workflow_dispatch:
permissions:
  contents: read
  id-token: write
  issues: write
  pull-requests: read
```

#### `code-simplifier.yml`
Nightly DRY enforcement, creates draft PRs.

```yaml
on:
  schedule:
    - cron: "0 4 * * *"    # Daily 4am UTC
  workflow_dispatch:
permissions:
  contents: write
  id-token: write
  pull-requests: write
```

#### `issue-hygiene.yml`
Weekly duplicate detection, links merged PRs.

```yaml
on:
  schedule:
    - cron: "0 7 * * 1"    # Mon 7am UTC
  workflow_dispatch:
permissions:
  contents: read
  id-token: write
  issues: write
  pull-requests: read
```

#### `issue-sweeper.yml`
Weekly scan of open issues, closes resolved ones.

```yaml
on:
  schedule:
    - cron: "0 6 * * 1"    # Mon 6am UTC
  workflow_dispatch:
permissions:
  contents: read
  id-token: write
  issues: write
  pull-requests: read
```

#### `label-sync.yml`
Syncs canonical labels from `.github` repo.

```yaml
on:
  schedule:
    - cron: "0 5 * * 0"    # Sun 5am UTC
  workflow_dispatch:
permissions:
  contents: read
  id-token: write
  issues: write
```

#### `next-steps.yml`
Daily momentum analyzer, creates issues or PRs with suggested next actions.

```yaml
on:
  schedule:
    - cron: "0 5 * * *"    # Daily 5am UTC
  workflow_dispatch:
permissions:
  contents: write
  id-token: write
  issues: write
  pull-requests: write
```

#### `repo-orchestrator.yml`
On-demand multi-repo workflow dispatcher.

```yaml
on:
  workflow_dispatch:
permissions:
  actions: write
  contents: read
  id-token: write
```

---

## Verifying Deployment

After adding callers to your repo, use the verification runbook at [VERIFICATION.md](VERIFICATION.md)
or run the e2e test script:

```bash
bash .github/scripts/verification/e2e-test.sh check-scheduled
bash .github/scripts/verification/e2e-test.sh issue-lifecycle JacobPEvans/my-repo
```
