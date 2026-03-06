module.exports = async ({ github, context, core }) => {
  const dailyRunLimit = parseInt(process.env.DAILY_RUN_LIMIT || '5', 10);
  const workflowFile = process.env.WORKFLOW_FILE || '';

  if (dailyRunLimit === 0) {
    core.setOutput('should_run', 'true');
    core.info('Daily run limit disabled');
    return;
  }

  // Extract workflow file name from workflow_ref
  // Format: "owner/repo/.github/workflows/name.yml@refs/heads/main"
  const match = workflowFile.match(/\/([^/]+\.yml)@/);
  const workflowId = match ? match[1] : workflowFile;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const { data } = await github.rest.actions.listWorkflowRuns({
    owner: context.repo.owner,
    repo: context.repo.repo,
    workflow_id: workflowId,
    status: 'completed',
    per_page: 100,
  });

  const count = (data.workflow_runs || []).filter(
    run => new Date(run.created_at) > since
  ).length;

  if (count >= dailyRunLimit) {
    core.setFailed(`Daily limit reached (${count}/${dailyRunLimit} runs in last 24h)`);
    return;
  }

  core.setOutput('should_run', 'true');
  core.info(`Daily run count: ${count}/${dailyRunLimit}`);
};
