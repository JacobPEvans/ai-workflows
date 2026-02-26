module.exports = async ({ github, context, core }) => {
  const prNumber = parseInt(process.env.PR_NUMBER || '0', 10);
  const maxReviews = parseInt(process.env.MAX_REVIEWS || '1', 10);

  if (!prNumber) {
    core.setOutput('eligible', 'false');
    core.info('No PR number provided');
    return;
  }

  // 0 = unlimited
  if (maxReviews === 0) {
    core.setOutput('eligible', 'true');
    core.info('max_reviews=0: unlimited reviews allowed');
    return;
  }

  // Count actual PR reviews from claude[bot] (not progress comments)
  const reviews = await github.paginate(github.rest.pulls.listReviews, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
    per_page: 100,
  });

  const claudeReviews = reviews.filter(r => r.user?.login === 'claude[bot]');
  const reviewCount = claudeReviews.length;

  if (reviewCount >= maxReviews) {
    core.setOutput('eligible', 'false');
    core.info(`PR #${prNumber} already has ${reviewCount}/${maxReviews} Claude review(s) — skipping`);
    return;
  }

  core.setOutput('eligible', 'true');
  core.info(`PR #${prNumber} has ${reviewCount}/${maxReviews} Claude review(s) — eligible`);
};
