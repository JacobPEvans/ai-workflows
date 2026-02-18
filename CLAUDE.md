# ai-workflows

Reusable AI agent workflows for GitHub Actions. Consumer repos call these with thin ~10-20 line callers.

## Architecture

This repo is the single source of truth for CI/CD automation workflows. Each workflow is a GitHub reusable workflow (`on: workflow_call`) that consumer repos invoke via `uses: JacobPEvans/ai-workflows/.github/workflows/<name>.yml@v0.1.0`.

### Directory Structure

```
.github/
  configs/
    mcp-github.json.template       # MCP server config template (envsubst at runtime)
  prompts/
    *.md                            # Prompt files (one per workflow, 14 total)
  scripts/
    render-prompt.sh                # Shared: envsubst + GITHUB_OUTPUT for action-based workflows
    ci-fix/                         # Extracted JS scripts per workflow
    best-practices/
    final-pr-review/
    post-merge-tests/
    post-merge-docs-review/
  workflows/
    *.yml                           # Pure YAML workflow definitions (no embedded content)
```

### Workflow Types

**Action-based** (use `claude-code-action@v1`): ci-fix, claude-review, final-pr-review
- Prompts rendered via `render-prompt.sh` + step output (envsubst)
- No MCP config needed

**Agent-based** (use `claude-code-base-action@v0.0.56` + MCP): all others
- Static prompts: `prompt_file:` points directly to `.github/prompts/<name>.md`
- Dynamic prompts (post-merge-tests, post-merge-docs-review): envsubst to temp file
- MCP config: envsubst on `.github/configs/mcp-github.json.template`

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

### Cross-repo Checkout

Workflows check out this repo at runtime for scripts, prompts, and configs:

```yaml
- uses: actions/checkout@v4
  with:
    repository: JacobPEvans/ai-workflows
    sparse-checkout: |
      .github/scripts
      .github/prompts
      .github/configs
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

### Authentication

Use `CLAUDE_CODE_OAUTH_TOKEN` for all Claude Code workflows. Do not create aliases or alternative secret names.

### Version Tags for Actions

Use version tags (`@v7`, `@v4`, `@v1`) for trusted first-party GitHub actions (`actions/*`, `anthropics/*`). SHA pinning is not required for these.
