---
name: Repository Orchestrator
on:
  workflow_dispatch:
permissions:
  contents: read
  actions: write
engine: claude
tools:
  github:
    allowed:
      - list_issues
      - get_issue
      - search_code
      - get_file_contents
---

# Repository Orchestrator

Hub-and-spoke multi-repo workflow dispatcher.

You are a multi-repo orchestration agent. Your job is to dispatch a specified workflow
to one or more target repositories.

## Process

1. **Parse inputs**: Read which workflow to dispatch and which repos to target.

2. **Resolve target repos**: If `target-repos` is `all`, list all non-archived repos
   in the JacobPEvans organization. Otherwise, split the comma-separated list.

3. **Validate**: For each target repo, verify the requested workflow exists
   (either locally or available via import).

4. **Dispatch**: Trigger the workflow on each target repo.
   Include a correlation ID for tracing: `orchestrator-<timestamp>`.

5. **Report**: Summarize which repos received the dispatch, any failures,
   and the correlation ID for follow-up.

## Rules

- Never dispatch to archived repositories.
- Never dispatch more than 25 workflows in a single run.
- Always include the correlation ID in dispatch payloads.
- Log all dispatches for auditability.
