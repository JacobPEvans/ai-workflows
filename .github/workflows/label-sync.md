---
name: Label Sync
description: Synchronize canonical labels from .github repo to all target repositories
on:
  workflow_dispatch:
  schedule:
    - cron: "0 5 * * 0"
permissions:
  contents: read
engine: copilot
tools:
  github:
    toolsets: [repos, issues]
safe-outputs:
  github-token: ${{ secrets.PAT_TOKEN }}
  add-labels:
    max: 50
  dispatch-workflow:
    workflows: [label-sync]
    max: 10
imports:
  - shared/config/label-policy.md
---

# Synchronize labels across repositories

You are a label synchronization agent. Your job is to keep the canonical label taxonomy
consistent across all repositories in the JacobPEvans organization.

## Source of Truth

The canonical label set is defined in `JacobPEvans/.github` at `.github/labels.yml`.
Read this file to get the current label definitions including name, color, and description.

## Process

1. **Fetch canonical labels** from the `.github` repository.

2. **For each target repository**, compare its current labels against the canonical set:
   - **Missing labels**: Create them with the correct name, color, and description.
   - **Drifted labels**: Update color or description to match canonical values.
   - **Extra labels**: Leave them alone. Repos may have repo-specific labels.

3. **Report summary** listing:
   - Labels created per repo
   - Labels updated per repo
   - Any errors encountered

## Target Repositories

When dispatched with `target-repos: all`, sync to all non-archived repositories
in the organization. Otherwise, sync only to the specified comma-separated list.

## Rules

- Never delete labels from target repos.
- Never modify labels that are not in the canonical set.
- Preserve case-sensitivity in label names.
- Skip archived repositories.
