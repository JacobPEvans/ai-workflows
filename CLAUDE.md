# ai-workflows

Reusable AI agent workflows for GitHub Actions. Consumer repos call these with thin ~10-20 line callers.

## Architecture

This repo is the single source of truth for CI/CD automation workflows. Each workflow is a GitHub reusable workflow (`on: workflow_call`) that consumer repos invoke via `uses: JacobPEvans/ai-workflows/.github/workflows/<name>.yml@v0.1.0`.

### Directory Structure

```
.github/
  prompts/
    *.md                            # Prompt files (one per workflow)
  scripts/
    render-prompt.sh                # Shared: envsubst + GITHUB_OUTPUT
    ci-fix/                         # Extracted JS scripts per workflow
    best-practices/
    final-pr-review/
    post-merge-tests/
    post-merge-docs-review/
  workflows/
    *.yml                           # Pure YAML workflow definitions (no embedded content)
```

### Workflow Types

**All workflows use `claude-code-action@v1`** with OIDC auth (`id-token: write`).

- Prompts rendered via `render-prompt.sh` + step output (envsubst)
- Static prompts: most workflows
- Dynamic prompts (ci-fix, post-merge-tests, post-merge-docs-review): `render-prompt.sh` with named env vars
- Write workflows (code-simplifier, next-steps, post-merge-*, ci-fix, issue-resolver): add `ssh_signing_key: ${{ secrets.GH_CLAUDE_SSH_SIGNING_KEY }}`

**Supported event types**: `issues`, `issue_comment`, `pull_request`, `pull_request_review`, `pull_request_review_comment`, `workflow_dispatch`, `repository_dispatch`, `schedule`, `workflow_run`. `push` is NOT supported — post-merge workflows use the dispatch pattern (see `docs/PATTERNS.md`).

**Bot guard**: `claude-code-action@v1` rejects Bot-type senders for `issues:` events internally. Consumer callers use the AI Dispatch Pattern: all `issues:opened` events dispatch as `workflow_dispatch`, selectively routing AI-created issues (`ai:created` label) with `skip_triage=true`. The reusable `issue-triage.yml` guards direct bot calls via input check: `if: (inputs.issue_number || '0') != '0' || github.event.sender.type != 'Bot'`. See `docs/PATTERNS.md` for the full AI Dispatch Pattern.

### Consumer Repo Caller Pattern

```yaml
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
    uses: JacobPEvans/ai-workflows/.github/workflows/issue-sweeper.yml@v0.3.3
    secrets: inherit
```

### Cross-repo Checkout

Workflows check out this repo at runtime for scripts and prompts:

```yaml
- uses: actions/checkout@v6
  with:
    repository: JacobPEvans/ai-workflows
    sparse-checkout: |
      .github/scripts
      .github/prompts
    path: .ai-workflows
```

## Workflow Authoring Rules

### File Format Separation

Never mix programming languages inline within workflow files. Each file must contain a single language:

- `.yml` files contain only YAML (workflow configuration)
- `.js` files contain only JavaScript
- `.md` files contain prompts (with `${VAR}` placeholders for dynamic values)
- `.json.template` files contain JSON config templates

**Inline threshold**: Scripts of 5 lines or fewer may be embedded directly in YAML workflow steps. Scripts exceeding 5 lines must be extracted to a dedicated file under `.github/scripts/` and referenced via the cross-repo checkout pattern.

**Pattern for extracted scripts** (`actions/github-script`):

```yaml
- uses: actions/github-script@v8
  with:
    script: |
      const run = require('./.ai-workflows/.github/scripts/<dir>/<name>.js');
      await run({ github, context, core });
```

```javascript
// .github/scripts/<dir>/<name>.js
module.exports = async ({ github, context, core }) => {
  // All logic here — one file, one language
};
```

Pass GitHub Actions expression values (`${{ }}`) via `env:` on the step, then read them with `process.env` in the script. Never interpolate expressions inside `.js` files.

### Authentication

Use `CLAUDE_CODE_OAUTH_TOKEN` for all Claude Code workflows. Do not create aliases or alternative secret names.

### Version Tags for Actions

Use version tags (`@v7`, `@v4`, `@v1`) for trusted first-party GitHub actions (`actions/*`, `anthropics/*`). SHA pinning is not required for these.
