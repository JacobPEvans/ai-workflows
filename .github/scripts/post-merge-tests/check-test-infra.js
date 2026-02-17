module.exports = async ({ github, context, core }) => {
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  const testIndicators = [
    'tests/', 'test/', '__tests__/', 'spec/',
    'jest.config.js', 'jest.config.ts', 'jest.config.mjs',
    'vitest.config.js', 'vitest.config.ts',
    'pytest.ini', 'conftest.py',
    '.mocharc.yml', '.mocharc.json',
  ];

  for (const indicator of testIndicators) {
    try {
      await github.rest.repos.getContent({
        owner,
        repo,
        path: indicator.replace(/\/$/, ''),
      });
      core.setOutput('has_tests', 'true');
      core.info(`Found test infrastructure: ${indicator}`);
      return;
    } catch {
      // Not found, continue checking
    }
  }

  // Check package.json for test script
  try {
    const { data } = await github.rest.repos.getContent({
      owner,
      repo,
      path: 'package.json',
    });
    const content = Buffer.from(data.content, 'base64').toString();
    const pkg = JSON.parse(content);
    if (pkg.scripts?.test && pkg.scripts.test !== 'echo "Error: no test specified" && exit 1') {
      core.setOutput('has_tests', 'true');
      core.info('Found test script in package.json');
      return;
    }
  } catch {
    // No package.json
  }

  // Check pyproject.toml for pytest config
  try {
    const { data } = await github.rest.repos.getContent({
      owner,
      repo,
      path: 'pyproject.toml',
    });
    const content = Buffer.from(data.content, 'base64').toString();
    if (content.includes('[tool.pytest]') || content.includes('pytest')) {
      core.setOutput('has_tests', 'true');
      core.info('Found pytest config in pyproject.toml');
      return;
    }
  } catch {
    // No pyproject.toml
  }

  core.setOutput('has_tests', 'false');
  core.info('No test infrastructure found in repository');
};
