module.exports = async ({ github, context, core }) => {
  const issueNumber = parseInt(process.env.ISSUE_NUMBER, 10);
  if (isNaN(issueNumber)) {
    core.setFailed('ISSUE_NUMBER is not a valid number');
    return;
  }

  const resolveResult = process.env.RESOLVE_RESULT;

  // Check if a draft PR was created referencing this issue
  const openPRs = await github.paginate(github.rest.pulls.list, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    state: 'open',
    per_page: 100,
  });
  const closePattern = new RegExp(
    `\\b(close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\\s+#${issueNumber}\\b`,
    'i'
  );
  const createdPR = openPRs.find(pr => closePattern.test(pr.body || ''));

  if (createdPR) {
    // Claude already commented on the issue from the prompt instructions
    core.info(`PR #${createdPR.number} was created for issue #${issueNumber}`);
    return;
  }

  // No PR found — post failure comment if resolve job did not succeed
  if (resolveResult !== 'success') {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issueNumber,
      body: [
        '### Auto-Resolution Failed',
        '',
        'Automated issue resolution was attempted but did not complete successfully.',
        'Manual intervention is required.',
        '',
        `_Resolution job result: \`${resolveResult}\`_`,
      ].join('\n'),
    });
    core.info(`Posted failure comment on issue #${issueNumber} (resolve result: ${resolveResult})`);
  }
};
