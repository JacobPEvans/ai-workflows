module.exports = async ({ github, context, core }) => {
  const runId = context.payload.workflow_run.id;
  const { data: jobs } = await github.rest.actions.listJobsForWorkflowRun({
    owner: context.repo.owner,
    repo: context.repo.repo,
    run_id: runId
  });
  let logs = '';
  for (const job of jobs.jobs.filter(j => j.conclusion === 'failure')) {
    logs += `\n=== FAILED JOB: ${job.name} ===\n`;
    try {
      const logData = await github.rest.actions.downloadJobLogsForWorkflowRun({
        owner: context.repo.owner,
        repo: context.repo.repo,
        job_id: job.id
      });
      const logLines = logData.data.split('\n');
      logs += logLines.slice(-200).join('\n');
    } catch (e) {
      logs += `(Could not download logs: ${e.message})\n`;
    }
  }
  const truncated = logs.length > 60000 ? logs.slice(-60000) : logs;
  core.setOutput('logs', truncated);
};
