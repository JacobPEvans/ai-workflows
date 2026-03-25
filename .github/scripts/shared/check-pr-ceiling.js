const { PR_DAILY_CEILING } = require('./constants');
const { get24hWindowStart } = require('./utils');

module.exports = async ({ github, context, core }) => {
  // Ceiling is configurable via env var on the workflow step (e.g., env: { PR_DAILY_CEILING: '10' }).
  // Falls back to PR_DAILY_CEILING from shared constants if unset or invalid.
  const parsed = parseInt(process.env.PR_DAILY_CEILING, 10);
  const ceiling = Number.isFinite(parsed) && parsed > 0 ? parsed : PR_DAILY_CEILING;
  const since = get24hWindowStart();
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
