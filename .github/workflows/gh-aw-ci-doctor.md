---
engine: copilot
imports:
  - githubnext/agentics/workflows/ci-doctor.md@main
on:
  workflow_run:
    workflows: ["Tests"]
    types: [completed]
    branches: [main]
if: ${{ github.event.workflow_run.conclusion == 'failure' || github.event.workflow_run.conclusion == 'cancelled' }}
---

<!-- Thin wrapper. Upstream is source of truth; see imports above. `gh aw update` re-syncs. -->
