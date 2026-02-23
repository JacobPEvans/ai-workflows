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

**Workflows**: ci-fix (find-pr.js, check-attempts.js, post-attempt-comment.js, get-failure-logs.js), best-practices (check-recent-activity.js), final-pr-review (check-gate.js), post-merge-docs-review (check-docs-relevance.js), post-merge-tests (check-test-infra.js)

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
