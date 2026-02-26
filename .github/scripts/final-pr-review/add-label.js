const LABEL_NAME = 'ai:reviewed';

module.exports = async ({ github, context, core }) => {
  const prNumber = parseInt(process.env.PR_NUMBER, 10);
  if (isNaN(prNumber)) {
    core.setFailed('PR_NUMBER is not a valid number');
    return;
  }
  const { owner, repo } = context.repo;

  await github.rest.issues.addLabels({
    owner,
    repo,
    issue_number: prNumber,
    labels: [LABEL_NAME],
  });
  core.info(`Added ${LABEL_NAME} label to PR #${prNumber}`);
};
