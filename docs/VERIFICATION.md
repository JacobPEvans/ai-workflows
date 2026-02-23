# Verification Runbook

This document describes how to verify all 15 workflows are operational after deployment.
Run via `.github/scripts/verification/e2e-test.sh` or manually using the steps below.

## Prerequisites

- `gh` CLI authenticated with sufficient scopes
- All consumer repos updated to `@v0.3.0`
- Secrets configured: `CLAUDE_CODE_OAUTH_TOKEN`, `GH_CLAUDE_SSH_SIGNING_KEY`

## Consumer Repos

- `JacobPEvans/nix-config` (nix)
- `JacobPEvans/terraform-proxmox`
- `JacobPEvans/ansible-proxmox-apps`

---

## Test A: Issue Lifecycle Chain

Tests: **issue-triage**, **issue-resolver** (via issue-auto-resolve.yml), **claude-review**

**Target repo**: `JacobPEvans/ansible-proxmox-apps` (least activity)

**Trigger**:
```bash
gh issue create \
  --repo JacobPEvans/ansible-proxmox-apps \
  --title "chore: add comment to main playbook" \
  --body "Add a brief descriptive comment to the top of site.yml"
```

**Expected chain**:
1. `issues: [opened]` → **issue-triage** → adds `type:chore` + `size:xs` labels
2. `issues: [opened]` → **issue-resolver** (eligibility passes for chore+xs) → creates draft PR
3. Draft PR creation → **claude-review** triggers on `pull_request: [opened]`

**Verify**:
```bash
# Wait ~2 minutes, then check:
gh run list --repo JacobPEvans/ansible-proxmox-apps --workflow "Issue Triage" --limit 1 --json status,conclusion,url
gh run list --repo JacobPEvans/ansible-proxmox-apps --workflow "Issue Auto-Resolve" --limit 1 --json status,conclusion,url
gh run list --repo JacobPEvans/ansible-proxmox-apps --workflow "Claude Code Review" --limit 1 --json status,conclusion,url
# Check issue labels:
ISSUE=$(gh issue list --repo JacobPEvans/ansible-proxmox-apps --search "add comment to main playbook" --json number -q '.[0].number')
gh issue view $ISSUE --repo JacobPEvans/ansible-proxmox-apps --json labels
# Check for linked PR:
gh pr list --repo JacobPEvans/ansible-proxmox-apps --state open --json title,isDraft
```

**Pass condition**: issue-triage run has `conclusion: success`, issue has labels, PR was created.

---

## Test B: PR Review Chain

Tests: **final-pr-review**

**Precondition**: Test A created a draft PR.

**Trigger**:
```bash
PR=$(gh pr list --repo JacobPEvans/ansible-proxmox-apps --state open --json number -q '.[0].number')
gh pr review $PR --repo JacobPEvans/ansible-proxmox-apps --approve
```

**Expected**: `pull_request_review: [submitted]` → **final-pr-review** gate check runs

**Verify**:
```bash
gh run list --repo JacobPEvans/ansible-proxmox-apps --workflow "Final PR Review" --limit 1 --json status,conclusion,url
```

**Pass condition**: Run triggered (gate job executed). Gate may skip Claude if conditions not met — that is valid.

---

## Test C: Post-Merge Chain

Tests: **post-merge-docs-review**, **post-merge-tests**

**Precondition**: Test A/B PR exists and is approved.

**Trigger**:
```bash
PR=$(gh pr list --repo JacobPEvans/ansible-proxmox-apps --state open --json number -q '.[0].number')
gh pr merge $PR --repo JacobPEvans/ansible-proxmox-apps --squash
```

**Expected**: `push: branches: [main]` triggers both post-merge workflows

**Verify**:
```bash
gh run list --repo JacobPEvans/ansible-proxmox-apps --workflow "Post-Merge Docs Review" --limit 1 --json status,conclusion,url
gh run list --repo JacobPEvans/ansible-proxmox-apps --workflow "Post-Merge Tests" --limit 1 --json status,conclusion,url
```

**Pass condition**: Runs triggered. Skipping via gate job (no test infra / no doc changes) is valid.

---

## Test D: CI Fix

Tests: **ci-fix**

**Target repo**: `JacobPEvans/terraform-proxmox` (has Markdown Lint CI)

**Trigger**:
```bash
# Create branch with intentional markdown lint error
git clone https://github.com/JacobPEvans/terraform-proxmox /tmp/tf-test
cd /tmp/tf-test
git checkout -b test/ci-fix-verification
# Add trailing whitespace to README
echo "test line with trailing space   " >> README.md
git add README.md
git commit -m "test: intentional lint error for ci-fix verification"
git push origin test/ci-fix-verification
gh pr create \
  --repo JacobPEvans/terraform-proxmox \
  --head test/ci-fix-verification \
  --base main \
  --title "test: CI fix verification" \
  --body "Intentional lint error to test ci-fix workflow. Close after verification."
```

**Expected**: Markdown Lint fails → `workflow_run: [completed]` with failure → **ci-fix** triggers

**Verify**:
```bash
# Wait ~3 minutes for CI to fail, then ci-fix to trigger:
gh run list --repo JacobPEvans/terraform-proxmox --workflow "CI Fix (Claude)" --limit 1 --json status,conclusion,url
```

**Pass condition**: ci-fix run triggered, attempts fix (pushes commit or posts comment).

**Cleanup**:
```bash
PR=$(gh pr list --repo JacobPEvans/terraform-proxmox --head test/ci-fix-verification --json number -q '.[0].number')
gh pr close $PR --repo JacobPEvans/terraform-proxmox
gh api -X DELETE repos/JacobPEvans/terraform-proxmox/git/refs/heads/test/ci-fix-verification
```

---

## Test E: Scheduled Workflows

These fire on cron — verify by checking the most recent run after deployment.

| Workflow | Schedule | Check Command |
|----------|----------|---------------|
| Best Practices Recommender | Wed 3am UTC | `gh run list --workflow "Best Practices Recommender"` |
| Code Simplifier | Daily 4am UTC | `gh run list --workflow "Code Simplifier"` |
| Next Steps | Daily 5am UTC | `gh run list --workflow "Next Steps"` |
| Issue Sweeper | Mon 6am UTC | `gh run list --workflow "Issue Sweeper"` |
| Issue Hygiene | Mon 7am UTC | `gh run list --workflow "Issue Hygiene"` |

Run across each consumer repo:
```bash
for REPO in JacobPEvans/nix-config JacobPEvans/terraform-proxmox JacobPEvans/ansible-proxmox-apps; do
  for WF in "Best Practices Recommender" "Code Simplifier" "Next Steps" "Issue Sweeper" "Issue Hygiene"; do
    echo "=== $REPO / $WF ==="
    gh run list --repo "$REPO" --workflow "$WF" --limit 1 --json status,conclusion,createdAt,url 2>/dev/null || echo "Not found"
  done
done
```

**Pass condition**: `conclusion != "failure"`. Any result other than "failure" confirms the migration worked
(the old failure mode was "Invalid API key" at 0 tokens — ANY different result is a win).

---

## Summary

| Test | Workflows | Pass Condition |
|------|-----------|----------------|
| A: Issue Lifecycle | issue-triage, issue-resolver, claude-review | Labels applied, PR created, review runs |
| B: PR Review | final-pr-review | Run triggered (gate executed) |
| C: Post-Merge | post-merge-docs-review, post-merge-tests | Runs triggered (gate jobs execute) |
| D: CI Fix | ci-fix | Run triggered, fix attempted |
| E: Scheduled (next run) | best-practices, code-simplifier, next-steps, issue-sweeper, issue-hygiene | conclusion != failure |

**Total**: 12 of 15 workflows verified via real triggers. (claude-review and final-pr-review are indirectly covered via Tests A and B.)
