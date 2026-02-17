module.exports = async ({ github, context, core }) => {
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  // Find the most recent best-practices issue using search API
  const { data: searchResult } = await github.rest.search.issuesAndPullRequests({
    q: `repo:${owner}/${repo} is:issue label:"type:chore" "best practices recommendations" in:title`,
    sort: 'created',
    order: 'desc',
    per_page: 1,
  });

  const lastRecommendation = searchResult.items?.[0] ?? null;

  if (!lastRecommendation) {
    core.setOutput('should_run', 'true');
    core.info('No prior best-practices recommendation found. Running recommendations.');
    return;
  }

  const since = lastRecommendation.created_at;
  core.info(`Checking for human commits since: ${since}`);

  // Paginate commits, stop as soon as a human commit is found
  const botPatterns = ['[bot]', 'noreply', 'github-actions'];
  let foundHuman = false;

  for await (const { data: commits } of github.paginate.iterator(
    github.rest.repos.listCommits,
    { owner, repo, since, per_page: 50 },
  )) {
    const human = commits.find((commit) => {
      if (commit.author?.type === 'User') {
        return true;
      }
      // Fallback for commits not associated with a GitHub account
      const login = commit.author?.login || '';
      const name = commit.commit.author?.name || '';
      const email = commit.commit.author?.email || '';
      const identifier = `${login} ${name} ${email}`.toLowerCase();
      return !botPatterns.some((pattern) => identifier.includes(pattern));
    });
    if (human) {
      foundHuman = true;
      break;
    }
  }

  if (!foundHuman) {
    core.setOutput('should_run', 'false');
    core.info('No human commits since last recommendation. Skipping.');
  } else {
    core.setOutput('should_run', 'true');
    core.info('Found human commits since last recommendation.');
  }
};
