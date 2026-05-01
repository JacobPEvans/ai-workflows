---
engine: copilot
imports:
  - githubnext/agentics/workflows/ai-moderator.md@main
on:
  roles: all
  issues:
    types: [opened]
    lock-for-agent: true
  issue_comment:
    types: [created]
    lock-for-agent: true
  pull_request:
    types: [opened]
    forks: "*"
  skip-roles: [admin, maintainer, write, triage]
  skip-bots: [github-actions, copilot, renovate, dependabot, release-please, jacobpevans-github-actions]
permissions:
  contents: read
  issues: read
  pull-requests: read
# Override upstream safe-outputs.hide-comment to reduce blast radius.
# Upstream gh-aw fatally fails the safe_outputs job when its hide_comment
# GraphQL mutation 404s on an already-deleted comment. We lower max from 5
# to 1 to reduce the failure window; the allowed-reasons field is a
# frontmatter hint but is not propagated to the compiled config.json, so
# it does not prevent hide_comment invocations at runtime.
# Re-evaluate once githubnext/agentics treats hide_comment 404 as non-fatal.
safe-outputs:
  hide-comment:
    max: 1
    allowed-reasons: []
---

# AI Moderator

<!-- Thin wrapper. Upstream is source of truth; see imports above. `gh aw update` re-syncs. -->
