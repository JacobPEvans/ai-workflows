module.exports = async ({ github, context, core }) => {
  const prNumber = parseInt(process.env.PR_NUMBER || '0', 10);
  const maxReviews = parseInt(process.env.MAX_REVIEWS || '1', 10);

  if (!prNumber) {
    core.setOutput('eligible', 'false');
    core.info('No PR number provided');
    return;
  }

  // 0 = unlimited; reject negative or NaN
  if (isNaN(maxReviews) || maxReviews < 0) {
    core.setOutput('eligible', 'false');
    core.info(`Invalid max_reviews value: "${process.env.MAX_REVIEWS}" — must be a non-negative integer`);
    return;
  }
  if (maxReviews === 0) {
    core.setOutput('eligible', 'true');
    core.info('max_reviews=0: unlimited reviews allowed');
    return;
  }

  // Count PR comments from claude[bot] as completed Claude reviews.
  // Using issue comments (PR-level) rather than listReviews because Claude posts
  // feedback via `gh pr comment`, not necessarily via a formal review submission.
  // progress tracking comments come from github-actions[bot], not claude[bot].
  const comments = await github.paginate(github.rest.issues.listComments, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    per_page: 100,
  });

  const claudeReviews = comments.filter(c => c.user?.login === 'claude[bot]' && c.user?.type === 'Bot');
  const reviewCount = claudeReviews.length;

  if (reviewCount >= maxReviews) {
    core.setOutput('eligible', 'false');
    core.info(`PR #${prNumber} already has ${reviewCount}/${maxReviews} Claude review(s) — skipping`);
    return;
  }

  core.setOutput('eligible', 'true');
  core.info(`PR #${prNumber} has ${reviewCount}/${maxReviews} Claude review(s) — eligible`);
};
