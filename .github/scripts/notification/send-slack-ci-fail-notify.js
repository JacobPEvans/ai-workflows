// .github/scripts/notification/send-slack-ci-fail-notify.js
// Posts a Slack Block Kit notification to #github-ci-failures when a workflow run fails.
module.exports = async ({ github, context, core }) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const workflowName = process.env.WORKFLOW_NAME;
  const runUrl = process.env.RUN_URL;
  const runId = process.env.RUN_ID;
  const headSha = process.env.HEAD_SHA;
  const headBranch = process.env.HEAD_BRANCH;
  const repoName = process.env.REPO_NAME;
  const eventName = process.env.EVENT_NAME;

  const sha7 = headSha ? headSha.slice(0, 7) : 'unknown';

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: ':rotating_light: CI Failure',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${runUrl}|${repoName} — ${workflowName}>*`,
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Branch:*\n${headBranch}` },
        { type: 'mrkdwn', text: `*Commit:*\n\`${sha7}\`` },
        { type: 'mrkdwn', text: `*Triggered by:*\n${eventName}` },
        { type: 'mrkdwn', text: `*Run:*\n<${runUrl}|${runId}>` },
      ],
    },
  ];

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });

  if (!response.ok) {
    core.setFailed(`Slack webhook failed: ${response.status} ${response.statusText}`);
    return;
  }

  core.info(`Slack CI failure notification sent: ${repoName} — ${workflowName} run ${runId}`);
};
