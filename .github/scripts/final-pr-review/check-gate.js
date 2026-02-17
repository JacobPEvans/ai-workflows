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

  // Gate 2: Skip if already reviewed by Claude
  const labels = pr.labels.map(l => l.name);
  if (labels.includes('claude-reviewed')) {
    core.setOutput('should_run', 'false');
    core.info(`PR #${prNumber} already has claude-reviewed label`);
    return;
  }

  // Gate 3: Skip if skip label present
  const skipLabels = ['skip-claude-review', 'skip-ai-review'];
  if (labels.some(l => skipLabels.includes(l))) {
    core.setOutput('should_run', 'false');
    core.info(`PR #${prNumber} has skip label`);
    return;
  }

  // Gate 4: Must have at least one human review
  const { data: reviews } = await github.rest.pulls.listReviews({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  const humanReviews = reviews.filter(r =>
    !r.user.login.includes('[bot]') && r.state !== 'PENDING'
  );
  if (humanReviews.length === 0) {
    core.setOutput('should_run', 'false');
    core.info(`PR #${prNumber} has no human reviews yet`);
    return;
  }

  // Gate 5: All required checks must pass
  const { data: checks } = await github.rest.checks.listForRef({
    owner: context.repo.owner,
    repo: context.repo.repo,
    ref: pr.head.sha,
  });

  const failedChecks = checks.check_runs.filter(c =>
    c.status === 'completed' &&
    c.conclusion !== 'success' &&
    c.conclusion !== 'skipped' &&
    c.conclusion !== 'neutral' &&
    c.name !== 'Final PR Review' &&
    c.name !== 'gate-check'
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
