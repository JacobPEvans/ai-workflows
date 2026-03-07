const DEFAULT_CEILING = 5;

module.exports = async ({ github, context, core }) => {
  // Ceiling is configurable via env var on the workflow step (e.g., env: { PR_DAILY_CEILING: '10' }).
  // Falls back to DEFAULT_CEILING if unset or invalid.
  const parsed = parseInt(process.env.PR_DAILY_CEILING, 10);
  const ceiling = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CEILING;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const botLogins = ['claude[bot]', 'github-actions[bot]'];

  let recentBotPRs = 0;
  try {
    // Use paginate.iterator to handle repos with >100 PRs.
    // API returns newest-first; stop once PRs are older than the 24h window.
    for await (const { data: prs } of github.paginate.iterator(github.rest.pulls.list, {
      owner: context.repo.owner,
      repo: context.repo.repo,
      state: 'all',
      sort: 'created',
      direction: 'desc',
      per_page: 100,
    })) {
      let pageHasRecent = false;
      for (const pr of prs) {
        if (new Date(pr.created_at) <= since) continue;
        pageHasRecent = true;
        if (botLogins.includes(pr.user?.login)) recentBotPRs++;
      }
      // All remaining pages are older — stop early
      if (!pageHasRecent) break;
    }
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
