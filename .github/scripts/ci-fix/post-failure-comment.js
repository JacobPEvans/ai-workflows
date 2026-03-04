module.exports = async ({ github, context, core }) => {
  const prNumberRaw = process.env.PR_NUMBER;
  const prNumber = prNumberRaw && Number.parseInt(prNumberRaw, 10);
  if (!Number.isInteger(prNumber)) return;
  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    body: `> **CI fix failed.** Workflow timed out or encountered an error.\n> [View run](${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId})\n> This PR may need manual CI fixes.`
  });
};
