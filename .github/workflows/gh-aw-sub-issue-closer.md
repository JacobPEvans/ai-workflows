---
engine: copilot
imports:
  - githubnext/agentics/workflows/sub-issue-closer.md@main
on:
  schedule: daily
  workflow_dispatch:
permissions:
  contents: read
  issues: read
---

<!-- Thin wrapper. Upstream is source of truth; see imports above. `gh aw update` re-syncs. -->
