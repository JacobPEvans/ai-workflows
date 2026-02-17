const LABEL_NAME = 'claude-reviewed';
const LABEL_COLOR = '7B68EE';
const LABEL_DESCRIPTION = 'Claude has performed a final review on this PR';

async function addLabel(github, owner, repo, prNumber) {
  await github.rest.issues.addLabels({
    owner,
    repo,
    issue_number: prNumber,
    labels: [LABEL_NAME],
  });
}

module.exports = async ({ github, context, core }) => {
  const prNumber = parseInt(process.env.PR_NUMBER, 10);
  const { owner, repo } = context.repo;

  try {
    await addLabel(github, owner, repo, prNumber);
    core.info(`Added ${LABEL_NAME} label to PR #${prNumber}`);
  } catch (error) {
    if (error.status === 404 || error.message.includes('not found')) {
      await github.rest.issues.createLabel({
        owner,
        repo,
        name: LABEL_NAME,
        color: LABEL_COLOR,
        description: LABEL_DESCRIPTION,
      });
      await addLabel(github, owner, repo, prNumber);
      core.info(`Created and added ${LABEL_NAME} label to PR #${prNumber}`);
    } else {
      throw error;
    }
  }
};
