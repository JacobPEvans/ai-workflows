module.exports = async ({ github, context, core }) => {
  const ceiling = parseInt(process.env.PR_DAILY_CEILING || '5', 10);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const botLogins = ['claude[bot]', 'github-actions[bot]'];

  let recentBotPRs = 0;
  try {
    const prs = await github.rest.pulls.list({
      owner: context.repo.owner,
      repo: context.repo.repo,
      state: 'all',
      per_page: 100,
    });
    recentBotPRs = prs.data.filter(
      pr => botLogins.includes(pr.user?.login) && new Date(pr.created_at) > since
    ).length;
  } catch (e) {
    core.info(`Failed to check bot PRs: ${e.message}. Failing open.`);
    core.setOutput('allowed', 'true');
    return;
  }

  if (recentBotPRs >= ceiling) {
    core.setOutput('allowed', 'false');
    core.info(`Daily bot PR ceiling reached (${recentBotPRs}/${ceiling}). Blocking.`);
    return;
  }

  core.setOutput('allowed', 'true');
  core.info(`Daily bot PR count: ${recentBotPRs}/${ceiling}`);
};
