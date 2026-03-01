module.exports = async ({ github, context, core }) => {
  const action = context.payload.action;
  const pr = context.payload.pull_request;

  // Gate 1: Determine mode from action + merged status
  let mode;
  if (action === 'opened') {
    mode = 'opened';
  } else if (action === 'closed' && pr && pr.merged === true) {
    mode = 'merged';
  } else if (action === 'closed' && pr && pr.merged !== true) {
    core.setOutput('should_run', 'false');
    core.info('PR was closed without merging — skipping');
    return;
  } else {
    core.setOutput('should_run', 'false');
    core.info(`Unrecognized action "${action}" — skipping`);
    return;
  }

  // Gate 2: Get PR number
  const prNumber = pr && pr.number;
  if (!prNumber) {
    core.setOutput('should_run', 'false');
    core.info('No PR number in event payload — skipping');
    return;
  }

  const { owner, repo } = context.repo;

  // Gate 3: Check for open issues — no point running if there are none
  const { data: openIssues } = await github.rest.issues.listForRepo({
    owner,
    repo,
    state: 'open',
    per_page: 1,
  });
  if (openIssues.length === 0) {
    core.setOutput('should_run', 'false');
    core.info('No open issues found — skipping');
    return;
  }

  // Gate 4: Dedup check — skip if a marker comment already exists on this PR
  const marker = `<!-- issue-linker-${mode} -->`;
  const { data: prComments } = await github.rest.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
  });
  const alreadyRan = prComments.some(c => c.body && c.body.includes(marker));
  if (alreadyRan) {
    core.setOutput('should_run', 'false');
    core.info(`Dedup marker "${marker}" already present on PR #${prNumber} — skipping`);
    return;
  }

  // All gates passed
  core.setOutput('should_run', 'true');
  core.setOutput('mode', mode);
  core.setOutput('pr_number', prNumber.toString());
  core.info(`PR #${prNumber} passed all gates — mode=${mode}`);
};
