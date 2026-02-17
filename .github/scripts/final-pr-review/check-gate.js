module.exports = async ({ github, context, core }) => {
  const prNumber = context.payload.pull_request?.number
    || context.payload.check_suite?.pull_requests?.[0]?.number;

  if (!prNumber) {
    core.setOutput('should_run', 'false');
    core.info('No PR associated with this event');
    return;
  }

  const { data: pr } = await github.rest.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  // Gate 1: PR must be open and not a draft
  if (pr.state !== 'open' || pr.draft) {
    core.setOutput('should_run', 'false');
    core.info(`PR #${prNumber} is ${pr.draft ? 'draft' : pr.state}, skipping`);
    return;
  }

  // Gate 2: PR must be mergeable (no conflicts)
  if (pr.mergeable === false) {
    core.setOutput('should_run', 'false');
    core.info(`PR #${prNumber} has merge conflicts, skipping`);
    return;
  }

  // Gate 3: Skip if already reviewed by Claude
  const labels = pr.labels.map(l => l.name);
  if (labels.includes('claude-reviewed')) {
    core.setOutput('should_run', 'false');
    core.info(`PR #${prNumber} already has claude-reviewed label`);
    return;
  }

  // Gate 4: Skip if skip label present
  const skipLabels = ['skip-claude-review', 'skip-ai-review'];
  if (labels.some(l => skipLabels.includes(l))) {
    core.setOutput('should_run', 'false');
    core.info(`PR #${prNumber} has skip label`);
    return;
  }

  // Gate 5: Must have at least one human review
  const { data: reviews } = await github.rest.pulls.listReviews({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  const humanReviews = reviews.filter(r =>
    r.user.type === 'User' && r.state !== 'PENDING'
  );
  if (humanReviews.length === 0) {
    core.setOutput('should_run', 'false');
    core.info(`PR #${prNumber} has no human reviews yet`);
    return;
  }

  // Gate 6: All checks must be completed and passing
  const { data: checks } = await github.rest.checks.listForRef({
    owner: context.repo.owner,
    repo: context.repo.repo,
    ref: pr.head.sha,
  });

  const ownChecks = ['Final PR Review', 'gate-check', 'Claude Final Review', 'Mark as reviewed'];
  const relevantChecks = checks.check_runs.filter(c => !ownChecks.includes(c.name));

  const pendingChecks = relevantChecks.filter(c => c.status !== 'completed');
  if (pendingChecks.length > 0) {
    core.setOutput('should_run', 'false');
    core.info(`PR #${prNumber} has ${pendingChecks.length} pending checks: ${pendingChecks.map(c => c.name).join(', ')}`);
    return;
  }

  const failedChecks = relevantChecks.filter(c =>
    c.conclusion !== 'success' &&
    c.conclusion !== 'skipped' &&
    c.conclusion !== 'neutral'
  );

  if (failedChecks.length > 0) {
    core.setOutput('should_run', 'false');
    core.info(`PR #${prNumber} has ${failedChecks.length} failing checks: ${failedChecks.map(c => c.name).join(', ')}`);
    return;
  }

  // All gates passed
  core.setOutput('should_run', 'true');
  core.setOutput('pr_number', String(prNumber));
  core.info(`PR #${prNumber} passed all gates — running final review`);
};
