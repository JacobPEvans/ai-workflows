---
name: Repository Orchestrator
description: Hub-and-spoke multi-repo workflow dispatcher
on:
  workflow_dispatch:
    inputs:
      workflow:
        description: Which workflow to dispatch
        required: true
        type: choice
        options: [issue-sweeper, code-simplifier, label-sync]
      target-repos:
        description: Comma-separated repo names or all
        required: true
        default: all
permissions:
  contents: read
engine: copilot
tools:
  github:
    toolsets: [repos, actions]
safe-outputs:
  github-token: ${{ secrets.PAT_TOKEN }}
  dispatch-workflow:
    max: 25
---

# Dispatch workflows across repositories

You are a multi-repo orchestration agent. Your job is to dispatch a specified workflow
to one or more target repositories.

## Process

1. **Parse inputs**: Read which workflow to dispatch and which repos to target.

2. **Resolve target repos**: If `target-repos` is `all`, list all non-archived repos
   in the JacobPEvans organization. Otherwise, split the comma-separated list.

3. **Validate**: For each target repo, verify the requested workflow exists
   (either locally or available via import).

4. **Dispatch**: Trigger the workflow on each target repo using `dispatch-workflow`.
   Include a correlation ID for tracing: `orchestrator-<timestamp>`.

5. **Report**: Summarize which repos received the dispatch, any failures,
   and the correlation ID for follow-up.

## Rules

- Never dispatch to archived repositories.
- Never dispatch more than 25 workflows in a single run.
- Always include the correlation ID in dispatch payloads.
- Log all dispatches for auditability.
