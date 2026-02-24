# Patterns Reference

All workflows in this repository use `anthropics/claude-code-action@v1` with OIDC auth.
The following patterns are used across the 15 reusable workflows.

---

## Standard Pattern

Used by most workflows. Static prompt, read-only tools.

**Workflows**: issue-triage, issue-hygiene, issue-sweeper, label-sync, project-router, repo-orchestrator, best-practices, next-steps (scheduled)

**Key elements**:
- `id-token: write` at both workflow-level and job-level permissions
- Cross-repo checkout of `.github/prompts` and `.github/scripts`
- `render-prompt.sh` to render the static prompt into a step output
- `claude-code-action@v1` with `claude_code_oauth_token:` and `prompt:`

```yaml
- name: Render prompt
  id: prompt
  run: bash .ai-workflows/.github/scripts/render-prompt.sh .ai-workflows/.github/prompts/<name>.md

- name: Run Claude
  uses: anthropics/claude-code-action@v1
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    prompt: ${{ steps.prompt.outputs.content }}
    claude_args: >-
      --allowedTools "Read,Glob,Grep,LS,Bash(gh issue:*)"
      --model claude-sonnet-4-6
```

---

## SSH Signing Pattern

Used by workflows that create commits or PRs. Adds `ssh_signing_key:` for verified commits.

**Workflows**: code-simplifier, next-steps (creates PRs), post-merge-docs-review, post-merge-tests, ci-fix, issue-resolver

**Additional permissions**: `contents: write`, `pull-requests: write`

**Additional input**:
```yaml
- name: Run Claude
  uses: anthropics/claude-code-action@v1
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    ssh_signing_key: ${{ secrets.GH_CLAUDE_SSH_SIGNING_KEY }}
    prompt: ${{ steps.prompt.outputs.content }}
    claude_args: >-
      --allowedTools "Edit,MultiEdit,Write,Read,Glob,Grep,LS,Bash(git:*),Bash(gh pr:*)"
      --model claude-sonnet-4-6
```

---

## Dynamic Prompt Pattern

Used by workflows whose prompts need runtime values (SHAs, repo names).

**Workflows**: ci-fix, post-merge-docs-review, post-merge-tests

**How it works**: Pass values via `env:` on the render step, then name them as positional args to `render-prompt.sh`:

```yaml
- name: Render prompt
  id: prompt
  env:
    MERGE_SHA: ${{ github.sha }}
    REPO_FULL_NAME: ${{ github.repository }}
  run: bash .ai-workflows/.github/scripts/render-prompt.sh .ai-workflows/.github/prompts/post-merge-tests.md MERGE_SHA REPO_FULL_NAME
```

The prompt file uses `${MERGE_SHA}` and `${REPO_FULL_NAME}` as placeholders.

---

## Gate Pattern

Used by workflows with a pre-check job that decides whether to run the expensive Claude step.

**Workflows**: best-practices (check-recent-activity), post-merge-docs-review (check-relevance), post-merge-tests (check-test-infra), ci-fix (should-fix), issue-resolver (eligibility check)

**Structure**: Two jobs — a lightweight gating job followed by the Claude job that only runs if the gate passes:

```yaml
jobs:
  check-activity:
    outputs:
      should_run: ${{ steps.check.outputs.should_run }}
    steps:
      - uses: actions/github-script@v8
        # ... lightweight check

  run-claude:
    needs: check-activity
    if: needs.check-activity.outputs.should_run == 'true'
    # ... Claude step
```

---

## Extracted Script Pattern

Used when workflow logic exceeds the 5-line inline threshold.

**Workflows**: ci-fix (find-pr.js, check-attempts.js, post-attempt-comment.js, get-failure-logs.js), best-practices (check-recent-activity.js), final-pr-review (check-gate.js), post-merge-docs-review (check-docs-relevance.js), post-merge-tests (check-test-infra.js), issue-resolver (check-eligibility.js)

```yaml
- uses: actions/github-script@v8
  with:
    script: |
      const run = require('./.ai-workflows/.github/scripts/ci-fix/find-pr.js');
      await run({ github, context, core });
```

```javascript
// .github/scripts/ci-fix/find-pr.js
module.exports = async ({ github, context, core }) => {
  // All logic here
};
```

Pass dynamic values (issue numbers, SHAs) via `env:` on the step, read via `process.env` in the script.

---

## Post-Merge Dispatch Pattern

Used by consumer callers for post-merge workflows. `push` events are NOT supported by `claude-code-action@v1`, so callers re-dispatch as `workflow_dispatch` and pass the commit SHA as an input.

**Workflows (consumers)**: post-merge-docs-review, post-merge-tests

**Why**: `push` events cause "Unsupported event type: push" failures in the Claude step. The reusable workflow runs fine under `workflow_dispatch`.

**Reusable workflow** accepts a `commit_sha` input to override `github.sha`:
```yaml
on:
  workflow_call:
    inputs:
      commit_sha:
        description: 'Override commit SHA for workflow_dispatch callers'
        required: false
        type: string
```

**Consumer caller** (two-job pattern — dispatch on push, call reusable on workflow_dispatch):
```yaml
name: Post-Merge Test Review
on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      commit_sha:
        description: 'Commit SHA to review'
        required: false
        type: string
permissions:
  actions: write
  contents: write
  id-token: write
  pull-requests: write
jobs:
  dispatch:
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Re-trigger as workflow_dispatch
        run: |
          gh workflow run "${{ github.workflow }}" \
            --repo "${{ github.repository }}" \
            --ref main \
            -f commit_sha="${{ github.sha }}"
        env:
          GH_TOKEN: ${{ github.token }}
  review:
    if: github.event_name == 'workflow_dispatch'
    uses: JacobPEvans/ai-workflows/.github/workflows/post-merge-tests.yml@v0.3.3
    with:
      commit_sha: ${{ inputs.commit_sha || github.sha }}
    secrets: inherit
```

Note: `actions: write` is required for `gh workflow run` to trigger the same workflow.

---

## Bot Guard Pattern

Used by any workflow triggered by `issues:` events to prevent bot-created issues from causing Claude failures.

**Required on**: issue-triage, issue-auto-resolve

**Apply at both levels**:
1. Reusable workflow job: `if: github.event.sender.type != 'Bot'`
2. Consumer caller job: `if: github.event.sender.type != 'Bot'`

```yaml
jobs:
  triage:
    if: github.event.sender.type != 'Bot'
    uses: JacobPEvans/ai-workflows/.github/workflows/issue-triage.yml@v0.3.3
    secrets: inherit
```

Without this guard, workflows created by bots (e.g., Next Steps creating feature issues) trigger `claude-code-action@v1`, which rejects non-human actors with "Non-human actor: claude (type: Bot)" and marks the run as failed.
