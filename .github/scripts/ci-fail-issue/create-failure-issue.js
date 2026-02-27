module.exports = async ({ github, context, core }) => {
  const { owner, repo } = context.repo;
  const commitSha = process.env.COMMIT_SHA;
  const runUrl = process.env.RUN_URL;
  const workflowName = process.env.WORKFLOW_NAME;
  const shortSha = commitSha.slice(0, 7);
  const marker = '<!-- ci-fail-issue -->';

  // Download failure logs
  const runId = context.payload.workflow_run.id;
  const allJobs = await github.paginate(github.rest.actions.listJobsForWorkflowRun, {
    owner, repo, run_id: runId
  });
  let logs = '';
  for (const job of allJobs.filter(j => j.conclusion === 'failure')) {
    logs += `\n=== FAILED JOB: ${job.name} ===\n`;
    try {
      const logData = await github.rest.actions.downloadJobLogsForWorkflowRun({
        owner, repo, job_id: job.id
      });
      const logLines = logData.data.split('\n');
      logs += logLines.slice(-100).join('\n');
    } catch (e) {
      logs += `(Could not download logs: ${e.message})\n`;
    }
  }
  const truncatedLogs = logs.length > 30000 ? logs.slice(-30000) : logs;

  const body = [
    marker,
    '',
    `## CI Failure: ${workflowName}`,
    '',
    `**Commit**: \`${commitSha}\``,
    `**Run**: ${runUrl}`,
    '',
    '### Failure Logs',
    '',
    '```',
    truncatedLogs || '(no logs available)',
    '```',
    '',
    '### Task',
    '',
    'Please investigate and fix the CI failure on the main branch. Open a pull request with the fix.',
    '',
    'Do not add workarounds or ignores - fix the actual root cause.',
  ].join('\n');

  const { data: issue } = await github.rest.issues.create({
    owner, repo,
    title: `fix: CI failure on main (${workflowName}, ${shortSha})`,
    body,
    labels: ['type:ci', 'priority:high', 'size:s', 'ai:created'],
  });

  core.info(`Created issue #${issue.number}: ${issue.html_url}`);

  try {
    await github.rest.issues.addAssignees({
      owner, repo,
      issue_number: issue.number,
      assignees: ['copilot[bot]'],
    });
    core.info('Assigned issue to copilot[bot]');
  } catch (e) {
    core.info(`Could not assign to copilot[bot]: ${e.message}`);
  }

  core.setOutput('issue_number', issue.number.toString());
  core.setOutput('issue_url', issue.html_url);
};
