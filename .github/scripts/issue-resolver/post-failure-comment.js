module.exports = async ({ github, context, core }) => {
  const issueNumberRaw = process.env.ISSUE_NUMBER;
  const issueNumber = Number.parseInt(issueNumberRaw, 10);
  if (!Number.isFinite(issueNumber)) return;
  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    body: `> **Auto-resolution failed.** Workflow timed out or encountered an error.\n> [View run](${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId})\n> This issue needs manual resolution.`
  });
};
