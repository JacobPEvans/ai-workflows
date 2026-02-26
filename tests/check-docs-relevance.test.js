const { createMockCore, createMockContext, createMockGithub } = require('./helpers.js');
const run = require('../.github/scripts/post-merge-docs-review/check-docs-relevance.js');

describe('check-docs-relevance', () => {
  let core, context, github;

  beforeEach(() => {
    core = createMockCore();
    context = createMockContext();
    github = createMockGithub();
    delete process.env.OVERRIDE_SHA;
  });

  it('sets is_relevant=true for markdown file changes', async () => {
    github.rest.repos.getCommit.mockResolvedValue({
      data: { files: [{ filename: 'README.md' }] },
    });
    await run({ github, context, core });
    expect(core.getOutput('is_relevant')).toBe('true');
  });

  it('sets is_relevant=true for code file changes outside .github/', async () => {
    github.rest.repos.getCommit.mockResolvedValue({
      data: { files: [{ filename: 'src/main.js' }] },
    });
    await run({ github, context, core });
    expect(core.getOutput('is_relevant')).toBe('true');
  });

  it('sets is_relevant=false for .github/ only changes', async () => {
    github.rest.repos.getCommit.mockResolvedValue({
      data: { files: [{ filename: '.github/workflows/test.yml' }] },
    });
    await run({ github, context, core });
    expect(core.getOutput('is_relevant')).toBe('false');
  });

  it('sets is_relevant=false when no files changed', async () => {
    github.rest.repos.getCommit.mockResolvedValue({ data: { files: [] } });
    await run({ github, context, core });
    expect(core.getOutput('is_relevant')).toBe('false');
  });
});
