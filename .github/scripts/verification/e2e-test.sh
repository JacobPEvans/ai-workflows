#!/usr/bin/env bash
# e2e-test.sh — End-to-end workflow verification script
#
# Tests that all workflows are operational after deployment to v0.3.0.
# Creates real events and monitors GitHub Actions workflow runs.
#
# Usage:
#   e2e-test.sh issue-lifecycle <repo>   Create test issue and verify triage + resolver chain
#   e2e-test.sh ci-fix <repo>            Create PR with lint error and verify ci-fix runs
#   e2e-test.sh check-scheduled          Check most recent scheduled workflow runs across all repos
#   e2e-test.sh check-all <repo>         Run issue-lifecycle + ci-fix + check-scheduled
#   e2e-test.sh cleanup <repo>           Close test issues/PRs created by verification
#
# Environment variables:
#   REPOS        Space-separated list (default: JacobPEvans/nix-config JacobPEvans/terraform-proxmox JacobPEvans/ansible-proxmox-apps)
#   POLL_INTERVAL  Seconds between status checks (default: 30)
#   MAX_WAIT     Max seconds to wait for workflow completion (default: 600)
#
# State file: /tmp/e2e-test-state.json (stores issue/PR numbers for cleanup)

set -euo pipefail

REPOS="${REPOS:-JacobPEvans/nix-config JacobPEvans/terraform-proxmox JacobPEvans/ansible-proxmox-apps}"
POLL_INTERVAL="${POLL_INTERVAL:-30}"
MAX_WAIT="${MAX_WAIT:-600}"
STATE_FILE="/tmp/e2e-test-state.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() { echo -e "${GREEN}PASS${NC}: $*"; }
fail() { echo -e "${RED}FAIL${NC}: $*"; }
info() { echo -e "${YELLOW}INFO${NC}: $*"; }

# Initialize state file
init_state() {
  if [[ ! -f "$STATE_FILE" ]]; then
    echo '{"issues":{},"prs":{}}' > "$STATE_FILE"
  fi
}

# Save artifact ID to state
save_state() {
  local type=$1 repo=$2 number=$3
  local current
  current=$(cat "$STATE_FILE")
  echo "$current" | python3 -c "
import json, sys
data = json.load(sys.stdin)
data['${type}']['${repo}'] = ${number}
print(json.dumps(data))
" > "$STATE_FILE"
}

# Poll for workflow run completion
wait_for_run() {
  local repo=$1 workflow=$2
  local elapsed=0
  info "Waiting for '$workflow' in $repo (max ${MAX_WAIT}s)..."
  while [[ $elapsed -lt $MAX_WAIT ]]; do
    local result
    result=$(gh run list --repo "$repo" --workflow "$workflow" \
      --limit 1 --json status,conclusion,url --jq '.[0]' 2>/dev/null || echo '{}')
    local status conclusion url
    status=$(echo "$result" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null || echo "")
    conclusion=$(echo "$result" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('conclusion',''))" 2>/dev/null || echo "")
    url=$(echo "$result" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('url',''))" 2>/dev/null || echo "")

    if [[ "$status" == "completed" ]]; then
      if [[ "$conclusion" == "success" || "$conclusion" == "skipped" ]]; then
        pass "'$workflow' completed with $conclusion — $url"
        return 0
      elif [[ "$conclusion" == "failure" ]]; then
        fail "'$workflow' FAILED — $url"
        return 1
      fi
    fi

    echo "  status=$status conclusion=$conclusion (${elapsed}s elapsed)"
    sleep "$POLL_INTERVAL"
    elapsed=$((elapsed + POLL_INTERVAL))
  done
  fail "Timed out waiting for '$workflow' in $repo after ${MAX_WAIT}s"
  return 1
}

# Test A: Issue lifecycle chain
cmd_issue_lifecycle() {
  local repo=${1:-JacobPEvans/ansible-proxmox-apps}
  init_state
  info "Creating test issue in $repo..."
  local issue_url
  issue_url=$(gh issue create \
    --repo "$repo" \
    --title "chore: add comment to main playbook" \
    --body "Add a brief descriptive comment to the top of site.yml" \
    --label "" 2>/dev/null || true)
  local issue_num
  issue_num=$(gh issue list --repo "$repo" \
    --search "add comment to main playbook" \
    --state open --json number -q '.[0].number' 2>/dev/null || echo "")
  if [[ -z "$issue_num" ]]; then
    fail "Could not create or find test issue"
    return 1
  fi
  save_state "issues" "$repo" "$issue_num"
  info "Created issue #$issue_num"

  wait_for_run "$repo" "Issue Triage"
  wait_for_run "$repo" "Issue Auto-Resolve"

  info "Checking for labels on issue #$issue_num..."
  local labels
  labels=$(gh issue view "$issue_num" --repo "$repo" --json labels -q '.labels[].name' 2>/dev/null || echo "")
  if [[ -n "$labels" ]]; then
    pass "Issue has labels: $labels"
  else
    fail "Issue has no labels after triage"
  fi

  info "Checking for draft PR..."
  local pr_num
  pr_num=$(gh pr list --repo "$repo" --state open --json number,isDraft \
    -q '.[] | select(.isDraft==true) | .number' 2>/dev/null | head -1 || echo "")
  if [[ -n "$pr_num" ]]; then
    save_state "prs" "$repo" "$pr_num"
    pass "Draft PR #$pr_num created by issue-resolver"
    wait_for_run "$repo" "Claude Code Review"
  else
    info "No draft PR found (issue-resolver may have skipped — check eligibility)"
  fi
}

# Test B/C: PR review + post-merge (manual steps, documented but not automated)
cmd_pr_review() {
  local repo=${1:-JacobPEvans/ansible-proxmox-apps}
  local pr_num
  pr_num=$(python3 -c "import json; d=json.load(open('$STATE_FILE')); print(d['prs'].get('$repo',''))" 2>/dev/null || echo "")
  if [[ -z "$pr_num" ]]; then
    pr_num=$(gh pr list --repo "$repo" --state open --json number -q '.[0].number' 2>/dev/null || echo "")
  fi
  if [[ -z "$pr_num" ]]; then
    fail "No PR found in $repo to review"
    return 1
  fi
  info "Approving PR #$pr_num in $repo..."
  gh pr review "$pr_num" --repo "$repo" --approve
  wait_for_run "$repo" "Final PR Review"
}

# Test D: CI Fix workflow
cmd_ci_fix() {
  local repo=${1:-JacobPEvans/terraform-proxmox}
  local branch="test/ci-fix-verification-$$"
  local tmpdir="/tmp/ci-fix-test-$$"
  init_state

  info "Cloning $repo..."
  gh repo clone "$repo" "$tmpdir" -- --depth=1
  cd "$tmpdir"
  git checkout -b "$branch"

  info "Adding intentional markdown lint error (trailing whitespace)..."
  echo "test line with trailing space   " >> README.md
  git add README.md
  git commit -m "test: intentional lint error for ci-fix verification"
  git push origin "$branch"

  info "Creating PR..."
  local pr_url
  pr_url=$(gh pr create \
    --repo "$repo" \
    --head "$branch" \
    --base main \
    --title "test: CI fix verification (close after test)" \
    --body "Intentional lint error to test ci-fix workflow. This PR should be closed after verification.")
  local pr_num
  pr_num=$(echo "$pr_url" | grep -oE '[0-9]+$')
  save_state "prs" "$repo" "$pr_num"
  info "Created PR #$pr_num: $pr_url"
  info "Waiting for CI to run and fail (may take ~2 minutes)..."
  sleep 90

  wait_for_run "$repo" "CI Fix (Claude)"
  cd /
  rm -rf "$tmpdir"
}

# Test E: Check scheduled workflows
cmd_check_scheduled() {
  local scheduled_workflows=(
    "Best Practices Recommender"
    "Code Simplifier"
    "Next Steps"
    "Issue Sweeper"
    "Issue Hygiene"
  )
  local all_pass=true
  for repo in $REPOS; do
    info "Checking scheduled workflows in $repo..."
    for wf in "${scheduled_workflows[@]}"; do
      local result
      result=$(gh run list --repo "$repo" --workflow "$wf" \
        --limit 1 --json status,conclusion,createdAt,url 2>/dev/null || echo "[]")
      local conclusion created url
      conclusion=$(echo "$result" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0].get('conclusion','') if d else 'no_runs')" 2>/dev/null || echo "no_runs")
      created=$(echo "$result" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0].get('createdAt','') if d else '')" 2>/dev/null || echo "")
      url=$(echo "$result" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0].get('url','') if d else '')" 2>/dev/null || echo "")

      if [[ "$conclusion" == "no_runs" ]]; then
        info "  $wf: no runs yet (scheduled only)"
      elif [[ "$conclusion" == "failure" ]]; then
        fail "  $wf: FAILED ($created) — $url"
        all_pass=false
      elif [[ -n "$conclusion" ]]; then
        pass "  $wf: $conclusion ($created)"
      else
        info "  $wf: in progress or pending"
      fi
    done
  done
  if $all_pass; then
    pass "All scheduled workflows: no failures found"
  fi
}

# Cleanup test artifacts
cmd_cleanup() {
  local repo=${1:-JacobPEvans/ansible-proxmox-apps}
  if [[ ! -f "$STATE_FILE" ]]; then
    info "No state file found at $STATE_FILE"
    return 0
  fi
  local issue_num pr_num
  issue_num=$(python3 -c "import json; d=json.load(open('$STATE_FILE')); print(d['issues'].get('$repo',''))" 2>/dev/null || echo "")
  pr_num=$(python3 -c "import json; d=json.load(open('$STATE_FILE')); print(d['prs'].get('$repo',''))" 2>/dev/null || echo "")

  if [[ -n "$pr_num" ]]; then
    info "Closing PR #$pr_num in $repo..."
    gh pr close "$pr_num" --repo "$repo" || true
  fi
  if [[ -n "$issue_num" ]]; then
    info "Closing issue #$issue_num in $repo..."
    gh issue close "$issue_num" --repo "$repo" --comment "Closed: verification test complete" || true
  fi
  info "Cleanup complete"
}

# Run all tests
cmd_check_all() {
  local repo=${1:-JacobPEvans/ansible-proxmox-apps}
  cmd_issue_lifecycle "$repo"
  cmd_check_scheduled
  info "To complete Tests B/C (PR Review + Post-Merge), run:"
  echo "  $0 pr-review $repo"
  echo "Then merge the PR manually and verify post-merge workflows"
  info "To test CI Fix:"
  echo "  $0 ci-fix JacobPEvans/terraform-proxmox"
}

# Main dispatch
case "${1:-}" in
  issue-lifecycle) cmd_issue_lifecycle "${2:-}" ;;
  pr-review)       cmd_pr_review "${2:-}" ;;
  ci-fix)          cmd_ci_fix "${2:-}" ;;
  check-scheduled) cmd_check_scheduled ;;
  check-all)       cmd_check_all "${2:-}" ;;
  cleanup)         cmd_cleanup "${2:-}" ;;
  *)
    echo "Usage: $0 <command> [repo]"
    echo ""
    echo "Commands:"
    echo "  issue-lifecycle <repo>   Create test issue and verify triage + resolver chain"
    echo "  pr-review <repo>         Approve PR and verify final-pr-review"
    echo "  ci-fix <repo>            Create PR with lint error and verify ci-fix"
    echo "  check-scheduled          Check most recent scheduled workflow runs"
    echo "  check-all <repo>         Run issue-lifecycle + check-scheduled"
    echo "  cleanup <repo>           Close test issues/PRs"
    echo ""
    echo "Environment:"
    echo "  REPOS          Space-separated repo list (default: all 3 consumer repos)"
    echo "  POLL_INTERVAL  Seconds between checks (default: 30)"
    echo "  MAX_WAIT       Max wait seconds (default: 600)"
    exit 1
    ;;
esac
