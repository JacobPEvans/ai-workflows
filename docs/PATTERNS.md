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

## Commit Signing Pattern

Used by workflows that create commits or PRs. Adds `use_commit_signing: "true"` for commits verified as the Claude GitHub App.

**Workflows**: code-simplifier, next-steps (creates PRs), post-merge-docs-review, post-merge-tests, ci-fix, issue-resolver

**Additional permissions**: `contents: write`, `pull-requests: write`

**Additional input**:
```yaml
- name: Run Claude
  uses: anthropics/claude-code-action@v1
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    use_commit_signing: "true"
    prompt: ${{ steps.prompt.outputs.content }}
    claude_args: >-
      --allowedTools "Edit,MultiEdit,Write,Read,Glob,Grep,LS,Bash(git log:*),Bash(git diff:*),Bash(git show:*),Bash(git status:*),Bash(git branch:*),Bash(gh pr:*)"
      --model claude-sonnet-4-6
```

Uses GitHub API commit signing. Commits are automatically verified as the Claude GitHub App. `Bash(git:*)` is restricted to read-only subcommands to prevent unsigned CLI commits.

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

**Background**: `claude-code-action@v1` internally rejects Bot-type senders for `issues:` events. A simple `if:` condition on the job is insufficient — the action itself fails. The solution is the AI Dispatch Pattern (see below), which re-triggers bot-created issues as `workflow_dispatch`.

**Required on**: issue-triage (reusable workflow job guard)

The reusable `issue-triage.yml` guards against direct bot-triggered calls:

```yaml
jobs:
  triage:
    if: (inputs.issue_number || '0') != '0' || github.event.sender.type != 'Bot'
```

This passes when an `issue_number` is explicitly provided (dispatch pattern) OR when the sender is human. Blocks only direct bot-triggered calls without an issue number.

---

## AI Dispatch Pattern

Used by consumer `issue-auto-resolve.yml` callers to allow AI-created issues (tagged `ai:created`) to flow through the triage + resolve pipeline while blocking random bot spam.

**Why**: `claude-code-action@v1` rejects Bot-type senders internally. Re-dispatching as `workflow_dispatch` bypasses this restriction.

**Flow**:
```
issues:opened → dispatch job → workflow_dispatch → [triage if human] → resolve
                 ↑ filters:
                 - human issues: dispatch with skip_triage=false
                 - ai:created bot issues: dispatch with skip_triage=true
                 - other bot issues: exit (no dispatch)
```

**Consumer caller** (three-job unified pattern):
```yaml
name: Issue Auto-Resolve
on:
  issues:
    types: [opened]
  workflow_dispatch:
    inputs:
      issue_number:
        required: true
        type: string
      skip_triage:
        type: string
        default: "false"
permissions:
  actions: write
  contents: write
  id-token: write
  issues: write
  pull-requests: write
jobs:
  dispatch:
    if: github.event_name == 'issues'
    runs-on: ubuntu-latest
    permissions:
      actions: write
    steps:
      - name: Dispatch as workflow_dispatch
        env:
          GH_TOKEN: ${{ github.token }}
          WORKFLOW_NAME: ${{ github.workflow }}
          ISSUE_NUM: ${{ github.event.issue.number }}
          IS_BOT: ${{ github.event.sender.type == 'Bot' }}
          HAS_AI_LABEL: ${{ contains(github.event.issue.labels.*.name, 'ai:created') }}
        run: |
          if [[ "$IS_BOT" == "true" && "$HAS_AI_LABEL" != "true" ]]; then
            echo "Bot issue without ai:created label — skipping"
            exit 0
          fi
          SKIP="false"
          if [[ "$IS_BOT" == "true" ]]; then SKIP="true"; fi
          gh workflow run "$WORKFLOW_NAME" \
            --repo "$GITHUB_REPOSITORY" \
            -f issue_number="$ISSUE_NUM" \
            -f skip_triage="$SKIP"
  run-triage:
    if: >-
      github.event_name == 'workflow_dispatch' &&
      inputs.skip_triage != 'true'
    uses: JacobPEvans/ai-workflows/.github/workflows/issue-triage.yml@v0.4.0
    secrets: inherit
    with:
      issue_number: ${{ inputs.issue_number }}
  resolve-issue:
    needs: [run-triage]
    if: >-
      always() &&
      github.event_name == 'workflow_dispatch' &&
      (needs.run-triage.result == 'success' || needs.run-triage.result == 'skipped')
    uses: JacobPEvans/ai-workflows/.github/workflows/issue-resolver.yml@v0.4.0
    secrets: inherit
    with:
      repo_context: "<repo-specific>"
      issue_number: ${{ inputs.issue_number }}
```

**Key points**:
- `WORKFLOW_NAME` passed via `env:` (not inline `${{ github.workflow }}`) to prevent template injection
- `always()` on `resolve-issue` ensures it runs even when `run-triage` was skipped
- `ai:created` label is the trust signal for bot issues (applied by `next-steps.yml`)
- `actions: write` scoped to the dispatch job only
- Daily resolver limit enforced by Gate 10 in `check-eligibility.js` (default: 5/24h)
