module.exports = async ({ github, context, core }) => {
  const prNumber = parseInt(process.env.PR_NUMBER, 10);

  try {
    await github.rest.issues.addLabels({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: prNumber,
      labels: ['claude-reviewed'],
    });
    core.info(`Added claude-reviewed label to PR #${prNumber}`);
  } catch (error) {
    // Label might not exist yet — create it first
    if (error.status === 404 || error.message.includes('not found')) {
      await github.rest.issues.createLabel({
        owner: context.repo.owner,
        repo: context.repo.repo,
        name: 'claude-reviewed',
        color: '7B68EE',
        description: 'Claude has performed a final review on this PR',
      });
      await github.rest.issues.addLabels({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: prNumber,
        labels: ['claude-reviewed'],
      });
      core.info(`Created and added claude-reviewed label to PR #${prNumber}`);
    } else {
      throw error;
    }
  }
};
