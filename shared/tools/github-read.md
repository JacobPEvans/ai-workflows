---
name: GitHub Read-Only Tools
description: Common read-only GitHub API tool configuration for importing into workflows
---

# GitHub Read-Only Tools

Standard tool configuration for workflows that need read access to GitHub resources.

```yaml
tools:
  github:
    toolsets: [repos, issues, pull_requests]
```

## Included Toolsets

- **repos**: Repository metadata, file contents, branches, commits
- **issues**: Issue listing, reading, comments, labels
- **pull_requests**: PR listing, reading, reviews, checks

## Usage

Import this file in your workflow frontmatter:

```yaml
imports:
  - shared/tools/github-read.md
```

This grants read-only access. Write operations (creating issues, commenting, closing)
require `safe-outputs` configured in the consuming workflow.
