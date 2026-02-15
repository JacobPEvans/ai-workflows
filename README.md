# ai-workflows

> Reusable AI agent workflows that run 24/7 — issue triage, code cleanup, multi-repo orchestration. Import-ready for [GitHub Copilot Agentic Workflows](https://github.blog/changelog/2026-02-13-github-agentic-workflows-are-now-in-technical-preview/).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Agentic Workflows](https://img.shields.io/badge/gh--aw-technical%20preview-blueviolet)](https://github.github.io/gh-aw/)
[![GitHub stars](https://img.shields.io/github/stars/JacobPEvans/ai-workflows?style=social)](https://github.com/JacobPEvans/ai-workflows/stargazers)

---

## What's Inside

| Workflow | Pattern | Schedule | What It Does |
|----------|---------|----------|--------------|
| [Issue Sweeper](.github/workflows/issue-sweeper.md) | DailyOps | Weekly + on-demand | Scans all open issues, comments on progress, closes resolved with PR links |
| [Issue Triage](.github/workflows/issue-triage.md) | IssueOps | On issue open | Auto-categorize, deduplicate, label new issues |
| [Code Simplifier](.github/workflows/code-simplifier.md) | DailyOps | Nightly | DRY enforcement, dead code removal, creates draft PRs |
| [Label Sync](.github/workflows/label-sync.md) | LabelOps | Weekly + on-demand | Sync canonical labels across all repositories |
| [Project Router](.github/workflows/project-router.md) | ProjectOps | On issue/PR events | Auto-route to GitHub Projects with smart field assignment |
| [Repo Orchestrator](.github/workflows/repo-orchestrator.md) | Orchestration | On-demand | Hub-and-spoke multi-repo workflow dispatcher |

### Custom Agents

| Agent | Expertise | Used By |
|-------|-----------|---------|
| [Issue Analyst](.github/agents/issue-analyst.md) | Issue categorization, duplicate detection | Issue Triage, Issue Sweeper |
| [DRY Enforcer](.github/agents/dry-enforcer.md) | Code duplication, dead code, naming | Code Simplifier |
| [Label Expert](.github/agents/label-expert.md) | Label taxonomy, consistent application | Issue Triage, Label Sync |

### Shared Components

Importable building blocks for your own workflows:

| Component | Path | Description |
|-----------|------|-------------|
| GitHub Tools | `shared/tools/github-read.md` | Common read-only GitHub API tool config |
| Label Policy | `shared/config/label-policy.md` | Canonical label taxonomy and application rules |
| DRY Principles | `shared/prompts/dry-principles.md` | Code simplification and DRY enforcement rules |
| Issue Analysis | `shared/prompts/issue-analysis.md` | Issue categorization and duplicate detection |

---

## Quick Start

### Prerequisites

1. Install the [gh-aw CLI extension](https://github.github.io/gh-aw/):

   ```bash
   gh extension install github/gh-aw
   ```

2. GitHub Copilot Premium subscription (for `copilot` engine workflows)

### Import a Single Workflow

```bash
gh aw add JacobPEvans/ai-workflows/.github/workflows/issue-triage.md@v0.0.1
```

### Import Shared Components

Reference in your workflow's frontmatter:

```yaml
imports:
  - JacobPEvans/ai-workflows/shared/prompts/dry-principles.md@v0.0.1
  - JacobPEvans/ai-workflows/shared/config/label-policy.md@v0.0.1
```

### Compile After Importing

```bash
gh aw compile
```

---

## Workflow Details

### Issue Sweeper

Runs weekly (Monday 6am UTC) and on-demand. Iterates all open issues in a repository:

- **Resolved**: Finds linked/merged PRs, closes the issue with a comment linking the PR
- **In Progress**: Finds open PRs or branches, comments with current status
- **Stale**: No activity in 30+ days, comments asking for an update

### Issue Triage

Triggers on every new issue:

- Reads issue content and searches for duplicates among open issues
- Applies `type:*` label based on content analysis
- Respects priority/size labels set by issue forms
- Comments with a triage summary
- Labels duplicates and references the original issue

### Code Simplifier

Runs nightly at 4am UTC. Only activates if human (non-bot) commits occurred that day:

- Finds DRY violations (duplicate code blocks, repeated constants)
- Detects dead code (unused imports, unreachable branches)
- Identifies naming issues (files/directories that don't describe contents)
- Creates one focused draft PR for the highest-impact improvement

### Label Sync

Runs weekly (Sunday 5am UTC) and on-demand:

- Reads the canonical label set from `JacobPEvans/.github`
- Compares against target repository labels
- Creates missing labels, updates drifted colors/descriptions
- Reports a sync summary

### Project Router

Triggers on issue open/label and PR open/ready events:

- Routes items to the org-level GitHub Projects board
- Sets project fields based on issue/PR labels and content

### Repo Orchestrator

On-demand hub workflow:

- Dispatches any workflow to target repositories
- Supports `all` or comma-separated repo list
- Hub-and-spoke pattern for multi-repo operations

---

## Architecture

```
ai-workflows/
├── .github/
│   ├── workflows/          # gh-aw workflow definitions (.md → .lock.yml)
│   ├── agents/             # Custom AI agent definitions
│   └── aw/                 # Import cache (auto-generated)
├── shared/                 # Importable components for other repos
│   ├── tools/              # Tool configurations
│   ├── config/             # Policy templates
│   └── prompts/            # Reusable prompt rules
└── docs/                   # Guides and documentation
```

Workflows are written in Markdown following the [gh-aw specification](https://github.github.io/gh-aw/reference/workflow-structure/). Each `.md` file compiles to a `.lock.yml` GitHub Actions workflow via `gh aw compile`.

---

## Built on gh-aw Patterns

Every workflow follows official [GitHub Agentic Workflow patterns](https://github.github.io/gh-aw/) — no custom reinvention:

- **[IssueOps](https://github.github.io/gh-aw/patterns/issueops/)** — Issue-triggered automation with sanitized inputs
- **[LabelOps](https://github.github.io/gh-aw/patterns/labelops/)** — Label-triggered routing and escalation
- **[DailyOps](https://github.github.io/gh-aw/patterns/dailyops/)** — Scheduled incremental progress with persistent memory
- **[ProjectOps](https://github.github.io/gh-aw/patterns/projectops/)** — GitHub Projects V2 automation
- **[MultiRepoOps](https://github.github.io/gh-aw/patterns/multirepoops/)** — Cross-repository orchestration
- **[Orchestration](https://github.github.io/gh-aw/patterns/orchestration/)** — Workflow coordination and dispatch

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## License

[MIT](LICENSE)
