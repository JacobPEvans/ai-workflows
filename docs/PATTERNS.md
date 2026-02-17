# Patterns Reference

Every workflow in this repository follows an official
[GitHub Agentic Workflow pattern](https://github.github.io/gh-aw/).

## Pattern Summary

### IssueOps

Event-driven automation triggered by issue creation or updates. Separates read
permissions (agent) from write permissions (safe-outputs). Sanitizes issue data
to prevent prompt injection.

**Used by**: Issue Triage

**Docs**: [gh-aw IssueOps](https://github.github.io/gh-aw/patterns/issueops/)

### LabelOps

Label-triggered automation. Filters events by specific label names using the
`names:` field. Supports both `labeled` and `unlabeled` events.

**Used by**: Label Sync, Issue Triage

**Docs**: [gh-aw LabelOps](https://github.github.io/gh-aw/patterns/labelops/)

### DailyOps

Scheduled incremental progress with persistent memory. Uses `cache-memory` for
state across runs and GitHub Discussions for continuity. Three-phase approach:
research, configure, execute.

**Used by**: Issue Sweeper, Code Simplifier, Next Steps

**Docs**: [gh-aw DailyOps](https://github.github.io/gh-aw/patterns/dailyops/)

### ProjectOps

GitHub Projects V2 automation. Routes items to project boards and dynamically
assigns fields based on issue/PR metadata.

**Used by**: Project Router

**Docs**: [gh-aw ProjectOps](https://github.github.io/gh-aw/patterns/projectops/)

### MultiRepoOps

Cross-repository automation using `safe-outputs` with `target-repo` parameter.
Hub-and-spoke tracking pattern with PAT authentication.

**Used by**: Label Sync, Repo Orchestrator

**Docs**: [gh-aw MultiRepoOps](https://github.github.io/gh-aw/patterns/multirepoops/)

### Orchestration

Workflow coordination where an orchestrator dispatches to single-purpose workers.
Uses correlation IDs for tracing and `dispatch-workflow` safe outputs.

**Used by**: Repo Orchestrator

**Docs**: [gh-aw Orchestration](https://github.github.io/gh-aw/patterns/orchestration/)
