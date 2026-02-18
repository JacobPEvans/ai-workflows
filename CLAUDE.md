# ai-workflows

Reusable AI agent workflows for GitHub Actions. Consumer repos call these with thin ~10-20 line callers.

## Architecture

This repo is the single source of truth for CI/CD automation workflows. Each workflow is a GitHub reusable workflow (`on: workflow_call`) that consumer repos invoke via `uses: JacobPEvans/ai-workflows/.github/workflows/<name>.yml@v0.1.0`.

### Workflow Types

**Action-based** (use `claude-code-action@v1`): ci-fix, claude-review, final-pr-review
**Agent-based** (use `claude-code-base-action@v0.0.56` + MCP): all others

### Consumer Repo Caller Pattern

```yaml
name: Issue Sweeper
on:
  schedule:
    - cron: "0 6 * * 1"
  workflow_dispatch:
jobs:
  sweep:
    uses: JacobPEvans/ai-workflows/.github/workflows/issue-sweeper.yml@v0.1.0
    secrets: inherit
```

### Cross-repo Script Checkout

Workflows needing scripts check out this repo at runtime:

```yaml
- uses: actions/checkout@v4
  with:
    repository: JacobPEvans/ai-workflows
    sparse-checkout: .github/scripts
    path: .ai-workflows
```

## Workflow Authoring Rules

### File Format Separation

Never mix programming languages inline within workflow files. Each file must contain a single language:

- `.yml` files contain only YAML (workflow configuration)
- `.js` files contain only JavaScript

**Inline threshold**: Scripts of 5 lines or fewer may be embedded directly in YAML workflow steps. Scripts exceeding 5 lines must be extracted to a dedicated file under `.github/scripts/` and referenced via the cross-repo checkout pattern.

**Pattern for extracted scripts** (`actions/github-script`):

```yaml
- uses: actions/github-script@v7
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

### Source Documentation

The `.md` files in `.github/workflows/` are retained as documentation for each workflow's design and prompt content. They are not compiled — the `.yml` files are the authoritative workflow definitions.

### Authentication

Use `CLAUDE_CODE_OAUTH_TOKEN` for all Claude Code workflows. Do not create aliases or alternative secret names.

### Version Tags for Actions

Use version tags (`@v7`, `@v4`, `@v1`) for trusted first-party GitHub actions (`actions/*`, `anthropics/*`). SHA pinning is not required for these.
