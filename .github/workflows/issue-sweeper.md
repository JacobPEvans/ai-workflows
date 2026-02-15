---
name: Issue Sweeper
description: Weekly scan of open issues - comments on progress, closes resolved issues with PR links
on:
  schedule:
    - cron: "0 6 * * 1"
  workflow_dispatch:
permissions:
  contents: read
  issues: read
  pull-requests: read
engine: copilot
model: gpt-4o
max-turns: 50
tools:
  github:
    toolsets: [repos, issues, pull_requests]
safe-outputs:
  github-token: ${{ secrets.GITHUB_TOKEN }}
  add-comment:
    max: 50
    target: triggering
  update-issue:
    max: 20
cache-memory:
  retention-days: 30
imports:
  - shared/tools/github-read.md
  - shared/prompts/issue-analysis.md
---

# Sweep all open issues for completeness

You are an issue completeness analyst. Your job is to review every open issue in this
repository and determine its current status.

## Process

For each open issue:

1. **Check for linked PRs**: Search for pull requests that reference this issue number
   (`#<number>` in title, body, or commits). Check if any are merged.

2. **Check for branches**: Look for branches named after the issue
   (e.g., `feat/issue-42`, `fix/42-description`).

3. **Check recent commits**: Search commit messages from the last 30 days for references
   to this issue number.

4. **Classify the issue**:

   - **Resolved**: A merged PR references this issue. Close the issue with a comment
     linking the PR(s) that resolved it. Use format:
     `Resolved by #<pr-number>. Closing automatically.`

   - **In Progress**: An open PR or active branch exists. Comment with current status:
     `In progress: PR #<number> is open (or branch <name> exists).`
     Do not comment if you already commented with the same status previously.

   - **Stale**: No linked PRs, no branches, no commit references, and no activity in
     30+ days. Comment:
     `This issue has had no activity for 30+ days. Is this still relevant?`
     Do not comment if a stale comment was already posted.

## Rules

- Never close an issue unless a merged PR directly references it.
- Never duplicate comments. Check existing comments before posting.
- Process issues in order of oldest first.
- Store sweep results in cache-memory for trend tracking.
