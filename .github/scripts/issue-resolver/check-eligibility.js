module.exports = async ({ github, context, core }) => {
  // Gate 1: Issue exists in event payload
  const issueNumber = context.payload.issue?.number;
  if (!issueNumber) {
    core.setOutput('should_run', 'false');
    core.info('No issue in event payload');
    return;
  }

  // Fetch fresh issue data — labels may have been updated by triage after event fired
  const { data: issue } = await github.rest.issues.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
  });

  const labels = issue.labels.map(l => l.name);

  // Gate 2: Required labels present — triage must have run
  const hasTypeLabel = labels.some(l => l.startsWith('type:'));
  const hasSizeLabel = labels.some(l => l.startsWith('size:'));
  if (!hasTypeLabel || !hasSizeLabel) {
    core.setOutput('should_run', 'false');
    core.info(`Issue #${issueNumber} missing type: or size: labels — triage may not have run`);
    return;
  }

  // Gate 3: Exclusion labels — block list from input
  const excludedLabels = (process.env.EXCLUDED_LABELS || '')
    .split(',')
    .map(l => l.trim())
    .filter(Boolean);
  const blockedLabel = labels.find(l => excludedLabels.includes(l));
  if (blockedLabel) {
    core.setOutput('should_run', 'false');
    core.info(`Issue #${issueNumber} has excluded label: ${blockedLabel}`);
    return;
  }

  // Gate 4: Triage skip labels
  const skipLabels = ['duplicate', 'invalid', 'wontfix', 'question'];
  const skipLabel = labels.find(l => skipLabels.includes(l));
  if (skipLabel) {
    core.setOutput('should_run', 'false');
    core.info(`Issue #${issueNumber} has triage skip label: ${skipLabel}`);
    return;
  }

  // Gate 5: Allowed issue types
  const allowedTypes = [
    'type:bug', 'type:chore', 'type:docs', 'type:ci',
    'type:test', 'type:refactor', 'type:perf',
  ];
  const issueType = labels.find(l => l.startsWith('type:'));
  if (!allowedTypes.includes(issueType)) {
    core.setOutput('should_run', 'false');
    core.info(`Issue #${issueNumber} type "${issueType}" not in allowed types`);
    return;
  }

  // Gate 6: Allowed sizes — only xs and s are safe for auto-resolution
  const allowedSizes = ['size:xs', 'size:s'];
  const issueSize = labels.find(l => l.startsWith('size:'));
  if (!allowedSizes.includes(issueSize)) {
    core.setOutput('should_run', 'false');
    core.info(`Issue #${issueNumber} size "${issueSize}" not in allowed sizes`);
    return;
  }

  // Gate 7: No existing open PR already referencing this issue
  const openPRs = await github.paginate(github.rest.pulls.list, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    state: 'open',
    per_page: 100,
  });
  const closePatterns = [
    new RegExp(`[Cc]loses\\s+#${issueNumber}\\b`),
    new RegExp(`[Ff]ixes\\s+#${issueNumber}\\b`),
  ];
  const existingPR = openPRs.find(pr =>
    closePatterns.some(p => p.test(pr.body || ''))
  );
  if (existingPR) {
    core.setOutput('should_run', 'false');
    core.info(`PR #${existingPR.number} already references issue #${issueNumber}`);
    return;
  }

  // Gate 8: Attempt limiting via comment markers
  const maxAttempts = parseInt(process.env.MAX_ATTEMPTS || '1', 10);
  const comments = await github.paginate(github.rest.issues.listComments, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    per_page: 100,
  });
  const marker = '<!-- claude-issue-resolver-attempt -->';
  const attemptCount = comments.filter(c => c.body.includes(marker)).length;
  if (attemptCount >= maxAttempts) {
    core.setOutput('should_run', 'false');
    core.info(`Issue #${issueNumber} has reached max attempts (${maxAttempts})`);
    return;
  }

  // Content sanitization: truncate and scan for injection patterns
  let issueBody = issue.body || '';
  if (issueBody.length > 4000) {
    issueBody = issueBody.substring(0, 4000) + '\n[... truncated ...]';
  }
  const injectionPatterns = [
    /ignore\s+previous\s+instructions/i,
    /disregard\s+all\s+(previous\s+)?instructions/i,
    /you\s+are\s+now\s+a/i,
    /forget\s+everything\s+above/i,
    /system\s+prompt\s*:/i,
  ];
  if (injectionPatterns.some(p => p.test(issueBody))) {
    core.info('Potential prompt injection pattern detected in issue body — content will be sandboxed in code fences');
  }

  // All gates passed
  core.setOutput('should_run', 'true');
  core.setOutput('issue_number', String(issueNumber));
  core.setOutput('issue_title', issue.title);
  core.setOutput('issue_body', issueBody);
  core.setOutput('issue_labels', labels.join(', '));
  core.setOutput('attempt', String(attemptCount + 1));
  core.info(`Issue #${issueNumber} passed all gates — attempt ${attemptCount + 1}/${maxAttempts}`);
};
