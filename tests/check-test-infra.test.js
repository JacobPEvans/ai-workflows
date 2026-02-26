const { createMockCore, createMockContext, createMockGithub } = require('./helpers.js');
const run = require('../.github/scripts/post-merge-tests/check-test-infra.js');

describe('check-test-infra', () => {
  let core, context, github;

  beforeEach(() => {
    core = createMockCore();
    context = createMockContext();
    github = createMockGithub();
    github.rest.repos.getContent.mockRejectedValue({ status: 404 });
  });

  it('sets has_tests=true when tests/ directory found', async () => {
    github.rest.repos.getContent.mockImplementation(({ path }) => {
      if (path === 'tests') return Promise.resolve({ data: {} });
      return Promise.reject({ status: 404 });
    });
    await run({ github, context, core });
    expect(core.getOutput('has_tests')).toBe('true');
  });

  it('sets has_tests=true when vitest.config.js found', async () => {
    github.rest.repos.getContent.mockImplementation(({ path }) => {
      if (path === 'vitest.config.js') return Promise.resolve({ data: {} });
      return Promise.reject({ status: 404 });
    });
    await run({ github, context, core });
    expect(core.getOutput('has_tests')).toBe('true');
  });

  it('sets has_tests=true when package.json has a test script', async () => {
    const pkg = { scripts: { test: 'bun test' } };
    const content = Buffer.from(JSON.stringify(pkg)).toString('base64');
    github.rest.repos.getContent.mockImplementation(({ path }) => {
      if (path === 'package.json') return Promise.resolve({ data: { content } });
      return Promise.reject({ status: 404 });
    });
    await run({ github, context, core });
    expect(core.getOutput('has_tests')).toBe('true');
  });

  it('sets has_tests=false when nothing found', async () => {
    await run({ github, context, core });
    expect(core.getOutput('has_tests')).toBe('false');
  });
});
