module.exports = async ({ github, context, core }) => {
  const { owner, repo } = context.repo;
  const run = context.payload.workflow_run;
  const sha = run.head_sha;
  const shortSha = sha.slice(0, 7);
  const marker = '<!-- ci-fail-issue -->';

  // Gate 1: conclusion must be 'failure'
  if (run.conclusion !== 'failure') {
    core.info(`Gate 1: conclusion is ${run.conclusion}, not failure — skipping`);
    core.setOutput('eligible', 'false');
    core.setOutput('skip_reason', `conclusion is ${run.conclusion}`);
    return;
  }
  core.info('Gate 1: conclusion is failure — pass');

  // Gate 2 & 3: skip if commit authored by a bot
  let authorLogin = '';
  try {
    const commitData = await github.rest.repos.getCommit({ owner, repo, ref: sha });
    authorLogin = commitData.data.author?.login || '';
  } catch (e) {
    core.info(`Could not get commit author: ${e.message}`);
  }

  const botAuthors = ['copilot[bot]', 'github-actions[bot]'];
  if (botAuthors.includes(authorLogin)) {
    core.info(`Gate 2/3: commit authored by ${authorLogin} — skipping to prevent loop`);
    core.setOutput('eligible', 'false');
    core.setOutput('skip_reason', `commit authored by ${authorLogin}`);
    return;
  }
  core.info(`Gate 2/3: author is ${authorLogin || '(unknown)'} — pass`);

  // Gate 4: no existing issue for this commit SHA
  const { data: searchResult } = await github.rest.search.issuesAndPullRequests({
    q: `repo:${owner}/${repo} is:issue is:open ${shortSha} in:body`
  });
  const existingIssue = searchResult.items.find(
    i => i.body && i.body.includes(sha) && i.body.includes(marker)
  );
  if (existingIssue) {
    core.info(`Gate 4: issue already exists for ${shortSha} (#${existingIssue.number}) — skipping`);
    core.setOutput('eligible', 'false');
    core.setOutput('skip_reason', `duplicate issue #${existingIssue.number}`);
    return;
  }
  core.info('Gate 4: no duplicate issue found — pass');

  // Gate 5: daily limit (max 3 issues per 24h)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recentIssues = await github.paginate(github.rest.issues.listForRepo, {
    owner, repo, state: 'open', since, per_page: 100
  });
  const recentCount = recentIssues.filter(i => i.body && i.body.includes(marker)).length;
  if (recentCount >= 3) {
    core.info(`Gate 5: daily limit reached (${recentCount}/3 in last 24h) — skipping`);
    core.setOutput('eligible', 'false');
    core.setOutput('skip_reason', `daily limit reached (${recentCount}/3)`);
    return;
  }
  core.info(`Gate 5: ${recentCount}/3 issues in last 24h — pass`);

  core.info('All gates passed — eligible to create issue');
  core.setOutput('eligible', 'true');
  core.setOutput('skip_reason', '');
  core.setOutput('commit_sha', sha);
  core.setOutput('run_url', run.html_url);
};
