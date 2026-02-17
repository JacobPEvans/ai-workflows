module.exports = async ({ github, context, core }) => {
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  // Find the most recent best-practices issue
  const { data: issues } = await github.rest.issues.listForRepo({
    owner,
    repo,
    state: 'all',
    labels: 'type:chore',
    per_page: 10,
    sort: 'created',
    direction: 'desc',
  });

  const lastRecommendation = issues.find((issue) =>
    issue.title.includes('best practices recommendations'),
  );

  const since = lastRecommendation
    ? lastRecommendation.created_at
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  core.info(`Checking for human commits since: ${since}`);

  // Get commits since last recommendation
  const { data: commits } = await github.rest.repos.listCommits({
    owner,
    repo,
    since,
    per_page: 50,
  });

  // Filter out bot commits
  const botPatterns = ['[bot]', 'noreply', 'github-actions'];
  const humanCommits = commits.filter((commit) => {
    const author = commit.author?.login || commit.commit.author?.name || '';
    return !botPatterns.some((pattern) => author.toLowerCase().includes(pattern));
  });

  if (humanCommits.length === 0) {
    core.setOutput('should_run', 'false');
    core.info('No human commits since last recommendation. Skipping.');
  } else {
    core.setOutput('should_run', 'true');
    core.info(`Found ${humanCommits.length} human commits since last recommendation.`);
  }
};
