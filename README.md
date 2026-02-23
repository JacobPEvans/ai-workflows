# ai-workflows

Reusable AI agent workflows for GitHub Actions. Consumer repos call these with thin ~10-20 line callers.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/JacobPEvans/ai-workflows?style=social)](https://github.com/JacobPEvans/ai-workflows/stargazers)

---

## What's Inside

| Workflow | Trigger | Schedule | What It Does |
|----------|---------|----------|--------------|
| `best-practices.yml` | `workflow_call` | Wed 3am UTC | Weekly audit creating actionable best-practices recommendations |
| `ci-fix.yml` | `workflow_run` | On CI failure | Analyzes failed CI logs and pushes fixes (max 2 attempts per PR) |
| `claude-review.yml` | `pull_request` | On PR open/sync | Reviews PRs for quality, security, and best practices |
| `code-simplifier.yml` | `workflow_call` | Daily 4am UTC | DRY enforcement, dead code removal, creates draft PRs |
| `final-pr-review.yml` | `pull_request_review` | On PR review | Final review gate before merge |
| `issue-hygiene.yml` | `workflow_call` | Mon 7am UTC | Detects duplicates, links merged PRs, flags stale issues |
| `issue-resolver.yml` | `issues: [opened]` | On issue open | Creates draft PRs for simple, well-scoped issues |
| `issue-sweeper.yml` | `workflow_call` | Mon 6am UTC | Scans open issues, comments on progress, closes resolved |
| `issue-triage.yml` | `issues: [opened]` | On issue open | Categorizes, deduplicates, and labels new issues |
| `label-sync.yml` | `workflow_call` | On-demand | Syncs canonical labels from `.github` repo to all targets |
| `next-steps.yml` | `workflow_call` | Daily 5am UTC | Analyzes merge momentum, suggests next logical action |
| `post-merge-docs-review.yml` | `push: [main]` | On merge | Reviews documentation after merges, creates fix PRs |
| `post-merge-tests.yml` | `push: [main]` | On merge | Analyzes merged code, creates draft PRs with targeted tests |
| `project-router.yml` | `workflow_call` | On issue/PR events | Routes items to GitHub Projects with smart field assignment |
| `repo-orchestrator.yml` | `workflow_call` | On-demand | Hub-and-spoke multi-repo workflow dispatcher |

---

## Quick Start

### Prerequisites

1. [GitHub CLI](https://cli.github.com/) installed and authenticated
2. Two secrets configured in each consumer repo:
   - `CLAUDE_CODE_OAUTH_TOKEN` — Claude Code OAuth token
   - `GH_CLAUDE_SSH_SIGNING_KEY` — SSH signing key for Claude commits (required for write workflows)

### Add a Workflow to Your Repo

Create a thin caller file in your repo. Example for issue triage:

```yaml
# .github/workflows/issue-triage.yml
name: Issue Triage
on:
  issues:
    types: [opened]
permissions:
  contents: read
  id-token: write
  issues: write
jobs:
  triage:
    uses: JacobPEvans/ai-workflows/.github/workflows/issue-triage.yml@v0.3.0
    secrets: inherit
```

For scheduled workflows:

```yaml
# .github/workflows/issue-sweeper.yml
name: Issue Sweeper
on:
  schedule:
    - cron: "0 6 * * 1"
  workflow_dispatch:
permissions:
  contents: read
  id-token: write
  issues: write
  pull-requests: read
jobs:
  sweep:
    uses: JacobPEvans/ai-workflows/.github/workflows/issue-sweeper.yml@v0.3.0
    secrets: inherit
```

See [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) for the full list of workflows with required permissions.

---

## Architecture

```
.github/
  prompts/              # Prompt files (one per workflow)
  scripts/
    render-prompt.sh    # Shared: envsubst + GITHUB_OUTPUT
    ci-fix/             # Extracted JS scripts per workflow
    best-practices/
    final-pr-review/
    post-merge-tests/
    post-merge-docs-review/
  workflows/            # Reusable workflow YAML definitions
docs/                   # Documentation and verification runbook
```

All workflows use `claude-code-action@v1` with OIDC auth (`id-token: write`). Prompts are rendered at runtime via `render-prompt.sh` and the cross-repo checkout pattern:

```yaml
- uses: actions/checkout@v6
  with:
    repository: JacobPEvans/ai-workflows
    sparse-checkout: |
      .github/prompts
      .github/scripts
    path: .ai-workflows
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding new workflows.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## License

[MIT](LICENSE)
