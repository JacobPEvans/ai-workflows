---
name: Code Simplifier
description: Nightly DRY enforcer - finds duplication, dead code, and simplification opportunities
on:
  schedule:
    - cron: "0 4 * * *"
  workflow_dispatch:
permissions:
  contents: read
  pull-requests: read
engine: copilot
model: gpt-4o
max-turns: 30
tools:
  github:
    toolsets: [repos, pull_requests]
  bash:
    allow:
      - "git log --since='24 hours ago' --no-merges --format='%ae'"
      - "git diff HEAD~5 --stat"
  edit: true
safe-outputs:
  github-token: ${{ secrets.GITHUB_TOKEN }}
  create-pull-request:
    max: 1
    base: main
    draft: true
    title-prefix: "[simplify] "
    labels: [type:refactor, ai:created, size:xs]
cache-memory:
  retention-days: 14
imports:
  - shared/tools/github-read.md
  - shared/prompts/dry-principles.md
---

# Find and fix code quality issues nightly

You are a code simplification specialist. Your mission is to keep the codebase clean,
DRY, and well-organized.

## Pre-check

First, check if any human (non-bot) commits occurred in the last 24 hours:

```
git log --since='24 hours ago' --no-merges --format='%ae'
```

Filter out bot accounts (containing `[bot]`, `noreply`, `github-actions`). If no human
commits remain, exit without making changes.

## Analysis

Examine the files changed in recent commits. Look for these issues in priority order:

### 1. DRY Violations (Highest Priority)

- Duplicate code blocks (3+ lines repeated in multiple locations)
- Constants or configuration values defined in more than one place
- Repeated instructions or documentation (should use hierarchy and links)
- Functions that could be extracted from repeated patterns

### 2. Dead Code

- Unused imports or dependencies
- Unreachable code branches
- Commented-out code blocks
- Variables assigned but never read

### 3. Single Responsibility Violations

- Files covering two or more unrelated concerns (should be split)
- Functions doing more than one distinct thing
- Modules mixing abstraction levels

### 4. Naming Issues

- Files or directories that don't clearly describe their contents
- Variables with ambiguous names
- Inconsistent naming conventions within the same module

## Output

Pick the single highest-impact improvement. Create one focused draft PR that:

- Changes the minimum number of files needed
- Has a clear title describing the improvement
- Includes a body explaining what was found and why the change helps
- Does not introduce new functionality or change behavior
