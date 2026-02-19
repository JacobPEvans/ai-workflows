module.exports = async ({ github, context, core }) => {
  const issueNumber = parseInt(process.env.ISSUE_NUMBER, 10);
  if (isNaN(issueNumber)) {
    core.setFailed('ISSUE_NUMBER is not a valid number');
    return;
  }

  const attempt = process.env.ATTEMPT;
  const maxAttempts = process.env.MAX_ATTEMPTS || '1';

  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    body: [
      '<!-- claude-issue-resolver-attempt -->',
      `### AI Issue Resolution (Attempt ${attempt}/${maxAttempts})`,
      '',
      'Claude is analyzing this issue and attempting to create a draft PR...',
      '',
      '_If the fix is insufficient, manual intervention will be needed._',
    ].join('\n'),
  });
};
