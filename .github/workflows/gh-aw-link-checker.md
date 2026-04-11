---
engine: copilot
imports:
  - githubnext/agentics/workflows/link-checker.md@main
on:
  schedule: daily on weekdays
  workflow_dispatch:
permissions:
  contents: read
  issues: read
  pull-requests: read
---

<!-- Thin wrapper. Upstream is source of truth; see imports above. `gh aw update` re-syncs. -->
