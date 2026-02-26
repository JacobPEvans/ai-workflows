module.exports = async ({ github, context, core }) => {
  const prNumber = parseInt(process.env.PR_NUMBER, 10);
  if (isNaN(prNumber)) {
    core.setFailed('PR_NUMBER is not a valid number');
    return;
  }
  const comments = await github.paginate(github.rest.issues.listComments, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    per_page: 100
  });
  const marker = '<!-- claude-ci-fix-attempt -->';
  const attempts = comments.filter(c => c.body && c.body.includes(marker)).length;
  core.info(`Found ${attempts} previous fix attempts`);
  if (attempts >= 2) {
    core.info('Max attempts reached, skipping');
    core.setOutput('should_run', 'false');
    core.setOutput('attempt', attempts.toString());
  } else {
    core.setOutput('should_run', 'true');
    core.setOutput('attempt', (attempts + 1).toString());
  }
};
