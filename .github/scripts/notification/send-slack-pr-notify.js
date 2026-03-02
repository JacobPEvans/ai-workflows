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

  if (!webhookUrl) {
    core.setFailed('SLACK_WEBHOOK_URL environment variable is not set');
    return;
  }

  // Parse provenance footer: > **AI Provenance** | Workflow: `name` | [Run id](url) | Event: `name` | Actor: `name`
  const provenanceMatch = prBody.match(/> \*\*AI Provenance\*\*.*\| Workflow: `(?<workflow>[^`]+)`.*\| \[Run (?<runId>\d+)\]\((?<runUrl>[^)]+)\).*\| Event: `(?<event>[^`]+)`.*\| Actor: `(?<actor>[^`]+)`/);
  const workflow = provenanceMatch?.groups?.workflow || 'unknown';
  const runId = provenanceMatch?.groups?.runId || null;
  const runUrl = provenanceMatch?.groups?.runUrl || null;
  const event = provenanceMatch?.groups?.event || 'unknown';
  const actor = provenanceMatch?.groups?.actor || 'unknown';

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

  let response;
  try {
    response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });
  } catch (error) {
    core.setFailed(`Slack webhook request threw an error: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  if (!response.ok) {
    core.setFailed(`Slack webhook failed: ${response.status} ${response.statusText}`);
    return;
  }

  core.info(`Slack notification sent for PR #${prNumber}`);
};
