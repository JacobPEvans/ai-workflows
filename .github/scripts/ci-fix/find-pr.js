module.exports = async ({ github, context, core }) => {
  const branch = context.payload.workflow_run.head_branch;
  const { data: prs } = await github.rest.pulls.list({
    owner: context.repo.owner,
    repo: context.repo.repo,
    head: `${context.repo.owner}:${branch}`,
    state: 'open'
  });
  if (prs.length === 0) {
    core.info(`No open PR for branch ${branch}`);
    core.setOutput('pr_number', '');
    return;
  }
  core.setOutput('pr_number', prs[0].number.toString());
};
