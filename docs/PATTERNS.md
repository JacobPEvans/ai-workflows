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
- `claude-code-action@v1` with `claude_code_oauth_token:`, `allowed_bots:`, and `prompt:`

```yaml
- name: Render prompt
  id: prompt
  run: bash .ai-workflows/.github/scripts/render-prompt.sh .ai-workflows/.github/prompts/<name>.md

- name: Run Claude
  uses: anthropics/claude-code-action@v1
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    allowed_bots: "github-actions"
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
    allowed_bots: "github-actions"
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

Two layers of bot filtering apply, depending on workflow type.

### Layer 1: Internal actor allowlist (`allowed_bots`)

`claude-code-action@v1` internally rejects Bot-type `github.actor` values. All dispatch patterns (`gh workflow run` with `GITHUB_TOKEN`) set `github.actor` to `github-actions[bot]`, which would cause "Workflow initiated by non-human actor" failures.

**Fix**: Every `claude-code-action@v1` step includes `allowed_bots: "github-actions"`. This allows the trusted internal dispatch actor while blocking external bots.

### Layer 2: Dependency bot filtering (`if:` guards)

PR-triggered workflows (claude-review, final-pr-review, ci-fix, issue-linker) add `if:` guards on their first job to skip runs triggered by dependency bots (Renovate, Dependabot). This produces a clean **skipped** (grey) status instead of a **failed** (red) status.

```yaml
  gate-check:
    if: >-
      github.actor != 'renovate[bot]' &&
      github.actor != 'dependabot[bot]'
```

**Why at the job level**: Skipping the first job causes GitHub to show all downstream jobs as skipped too — a clean grey tree.

### Layer 3: Post-merge commit-author check (JS scripts)

For post-merge workflows (push→dispatch pattern), `github.actor` in the re-dispatched `workflow_dispatch` run is `github-actions[bot]` — not the original merger. The gate scripts (`check-docs-relevance.js`, `check-test-infra.js`) instead check the **commit author** via the GitHub API and early-return when it matches a dependency bot.

```javascript
const authorLogin = commit.author?.login || '';
const depBots = ['renovate[bot]', 'dependabot[bot]'];
if (depBots.includes(authorLogin)) {
  core.setOutput('is_relevant', 'false');
  core.info(`Commit authored by ${authorLogin} — skipping`);
  return;
}
```

---

## AI Dispatch Pattern

Used by consumer `issue-auto-resolve.yml` callers to dispatch issues through the triage + resolve pipeline. All actors (human and bot) are welcome — cost control is via daily dispatch limits, not bot filtering.

**Triggers**:
- `issues: opened` — new issues auto-dispatch
- `issues: labeled` with `ai:ready` — re-trigger mechanism for existing issues

**Flow**:
```
issues:opened  → dispatch job → workflow_dispatch → triage → resolve
issues:labeled → (ai:ready?)  → workflow_dispatch → triage → resolve
                   ↑ safety:
                   - daily dispatch limit (default: 5/day)
                   - ai:ready label removed after dispatch (re-apply to re-trigger)
```

**Consumer caller** (three-job unified pattern):
```yaml
name: Issue Auto-Resolve
on:
  issues:
    types: [opened, labeled]
  workflow_dispatch:
    inputs:
      issue_number:
        required: true
        type: string
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
      issues: write
    steps:
      - name: Dispatch as workflow_dispatch
        env:
          GH_TOKEN: ${{ github.token }}
          WORKFLOW_NAME: ${{ github.workflow }}
          REPO: ${{ github.repository }}
          ISSUE_NUM: ${{ github.event.issue.number }}
          EVENT_ACTION: ${{ github.event.action }}
          LABEL_NAME: ${{ github.event.label.name }}
        run: |
          # Filter labeled events to only ai:ready
          if [[ "$EVENT_ACTION" == "labeled" && "$LABEL_NAME" != "ai:ready" ]]; then
            echo "Label '$LABEL_NAME' is not ai:ready — skipping"
            exit 0
          fi

          # Daily dispatch limit (cost control safety valve)
          TODAY=$(date -u +%Y-%m-%d)
          COUNT=$(gh run list \
            --workflow "$WORKFLOW_NAME" \
            --repo "$REPO" \
            --event workflow_dispatch \
            --created ">=$TODAY" \
            --json databaseId --jq 'length')
          if [[ "$COUNT" -ge 5 ]]; then
            echo "Daily dispatch limit reached ($COUNT/5) — skipping"
            exit 0
          fi

          # Remove ai:ready label so it can be re-applied to re-trigger
          if [[ "$EVENT_ACTION" == "labeled" && "$LABEL_NAME" == "ai:ready" ]]; then
            gh issue edit "$ISSUE_NUM" --repo "$REPO" --remove-label "ai:ready" || true
          fi

          gh workflow run "$WORKFLOW_NAME" \
            --repo "$REPO" \
            -f issue_number="$ISSUE_NUM"
  run-triage:
    if: github.event_name == 'workflow_dispatch'
    uses: JacobPEvans/ai-workflows/.github/workflows/issue-triage.yml@<version>
    secrets: inherit
    with:
      issue_number: ${{ inputs.issue_number }}
  resolve-issue:
    needs: [run-triage]
    if: >-
      always() &&
      github.event_name == 'workflow_dispatch' &&
      (needs.run-triage.result == 'success' || needs.run-triage.result == 'skipped')
    uses: JacobPEvans/ai-workflows/.github/workflows/issue-resolver.yml@<version>
    secrets: inherit
    with:
      repo_context: "<repo-specific>"
      issue_number: ${{ inputs.issue_number }}
```

**Key points**:
- `WORKFLOW_NAME` and `REPO` passed via `env:` (not inline `${{ }}`) to prevent template injection
- `always()` on `resolve-issue` ensures it runs even when `run-triage` was skipped
- `ai:ready` label is the re-trigger mechanism — removed after dispatch so it can be re-applied
- Daily dispatch limit (5/day) is the cost-control safety valve
- `actions: write` + `issues: write` scoped to the dispatch job
- Triage always runs (idempotent) — no `skip_triage` input needed

---

## Issue Linker Consumer Caller

The `issue-linker` workflow runs when PRs are opened or merged. Consumer repos should call it with both trigger types and inline `if:` conditions:

```yaml
name: PR Issue Linker
on:
  pull_request:
    types: [opened, closed]
    branches: [main]
permissions:
  contents: read
  id-token: write
  issues: write
  pull-requests: write
jobs:
  link-issues:
    if: >-
      !contains(github.event.pull_request.labels.*.name, 'ai:skip-review') &&
      (
        (github.event.action == 'opened' && !github.event.pull_request.draft) ||
        (github.event.action == 'closed' && github.event.pull_request.merged == true)
      )
    uses: JacobPEvans/ai-workflows/.github/workflows/issue-linker.yml@v0.4.0
    secrets: inherit
```

The `if:` condition handles two trigger modes:
- **Link mode** (`opened`): Runs when a non-draft PR is opened, linking issues and posting reviews for related issues
- **Close mode** (`closed` + `merged`): Runs when a PR merges, closing resolved issues with a reference comment

The gate script (`check-eligibility.js`) additionally skips runs when no open issues exist or when a dedup marker is already present.
