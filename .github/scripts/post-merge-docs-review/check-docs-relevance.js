module.exports = async ({ github, context, core }) => {
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const sha = context.sha;

  // Get the commit to find changed files
  const { data: commit } = await github.rest.repos.getCommit({
    owner,
    repo,
    ref: sha,
  });

  const files = commit.files || [];
  if (files.length === 0) {
    core.setOutput('is_relevant', 'false');
    core.info('No files changed in commit');
    return;
  }

  const docExtensions = ['.md', '.mdx', '.rst', '.txt', '.adoc'];
  const docPaths = ['docs/', 'doc/', 'documentation/', 'wiki/'];
  const docFiles = ['README', 'CHANGELOG', 'CONTRIBUTING', 'LICENSE', 'CLAUDE', 'AGENTS'];

  const hasDocChanges = files.some(f => {
    const filename = f.filename.toLowerCase();
    return docExtensions.some(ext => filename.endsWith(ext))
      || docPaths.some(p => filename.startsWith(p))
      || docFiles.some(d => filename.toUpperCase().includes(d));
  });

  // Code changes that should trigger doc review
  const hasCodeChanges = files.some(f => {
    const filename = f.filename;
    return !filename.startsWith('.github/')
      && !docExtensions.some(ext => filename.endsWith(ext))
      && (filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.py')
        || filename.endsWith('.go') || filename.endsWith('.rs') || filename.endsWith('.rb')
        || filename.endsWith('.tf') || filename.endsWith('.nix') || filename.endsWith('.yml')
        || filename.endsWith('.yaml'));
  });

  const isRelevant = hasDocChanges || hasCodeChanges;
  core.setOutput('is_relevant', String(isRelevant));
  core.setOutput('changed_files', JSON.stringify(files.map(f => f.filename)));
  core.info(`Doc relevance: ${isRelevant} (doc changes: ${hasDocChanges}, code changes: ${hasCodeChanges})`);
};
