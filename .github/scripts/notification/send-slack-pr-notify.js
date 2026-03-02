// .github/scripts/notification/send-slack-pr-notify.js
// Sends a Slack Block Kit notification when a Claude-authored PR opens.
// Extracts AI provenance metadata from the PR body footer.
module.exports = async ({ github, context, core }) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const prTitle = process.env.PR_TITLE;
  const prUrl = process.env.PR_URL;
  const prNumber = process.env.PR_NUMBER;
  const prBody = process.env.PR_BODY || '';
  const repoName = process.env.REPO_NAME;

  // Parse provenance footer: > **AI Provenance** | Workflow: `name` | [Run id](url) | Event: `name` | Actor: `name`
  const workflowMatch = prBody.match(/Workflow: `([^`]+)`/);
  const workflow = workflowMatch ? workflowMatch[1] : 'unknown';

  const runMatch = prBody.match(/\[Run (\d+)\]\(([^)]+)\)/);
  const runId = runMatch ? runMatch[1] : null;
  const runUrl = runMatch ? runMatch[2] : null;

  const eventMatch = prBody.match(/Event: `([^`]+)`/);
  const event = eventMatch ? eventMatch[1] : 'unknown';

  const actorMatch = prBody.match(/Actor: `([^`]+)`/);
  const actor = actorMatch ? actorMatch[1] : 'unknown';

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'AI-Created PR Opened',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${prUrl}|${repoName} #${prNumber}: ${prTitle}>*`,
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Workflow:*\n${workflow}` },
        { type: 'mrkdwn', text: `*Event:*\n${event}` },
        { type: 'mrkdwn', text: `*Actor:*\n${actor}` },
        { type: 'mrkdwn', text: `*Run:*\n${runUrl ? `<${runUrl}|${runId}>` : 'unknown'}` },
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

  core.info(`Slack notification sent for PR #${prNumber}`);
};
