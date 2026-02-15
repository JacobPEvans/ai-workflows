# Getting Started

Import ai-workflows into your repository using the gh-aw CLI.

## Prerequisites

- [GitHub CLI](https://cli.github.com/) installed
- [gh-aw extension](https://github.github.io/gh-aw/): `gh extension install github/gh-aw`
- GitHub Copilot Premium subscription (for `copilot` engine)

> **Note:** During the gh-aw technical preview, workflows compile with `engine: claude`. They will switch to `engine: copilot` once CLI support is available.

## Initialize Your Repository

If your repo doesn't use gh-aw yet:

```bash
cd your-repo
gh aw init
```

## Import a Workflow

```bash
gh aw add JacobPEvans/ai-workflows/.github/workflows/issue-triage.md@v0.0.1
```

This copies the workflow into your `.github/workflows/` and tracks its origin
for future updates.

## Import Shared Components

Reference components in your workflow's frontmatter `imports:` field:

```yaml
---
name: My Custom Workflow
imports:
  - JacobPEvans/ai-workflows/shared/prompts/dry-principles.md@v0.0.1
  - JacobPEvans/ai-workflows/shared/config/label-policy.md@v0.0.1
---
```

## Compile

After importing, compile to generate the `.lock.yml` files:

```bash
gh aw compile
```

Commit both the `.md` source and `.lock.yml` compiled file.

## Update Imported Workflows

```bash
gh aw update --verbose
```

Updates stay within the same major version automatically.

## Available Workflows

| Workflow | Import Path |
|----------|-------------|
| Issue Sweeper | `.github/workflows/issue-sweeper.md` |
| Issue Triage | `.github/workflows/issue-triage.md` |
| Code Simplifier | `.github/workflows/code-simplifier.md` |
| Label Sync | `.github/workflows/label-sync.md` |
| Project Router | `.github/workflows/project-router.md` |
| Repo Orchestrator | `.github/workflows/repo-orchestrator.md` |

## Available Shared Components

| Component | Import Path |
|-----------|-------------|
| GitHub Tools | `shared/tools/github-read.md` |
| Label Policy | `shared/config/label-policy.md` |
| DRY Principles | `shared/prompts/dry-principles.md` |
| Issue Analysis | `shared/prompts/issue-analysis.md` |
