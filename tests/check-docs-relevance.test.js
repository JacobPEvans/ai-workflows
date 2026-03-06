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

  it('sets is_relevant=false for renovate[bot] authored commits', async () => {
    github.rest.repos.getCommit.mockResolvedValue({
      data: { author: { login: 'renovate[bot]' }, files: [{ filename: 'README.md' }] },
    });
    await run({ github, context, core });
    expect(core.getOutput('is_relevant')).toBe('false');
  });

  it('sets is_relevant=false for dependabot[bot] authored commits', async () => {
    github.rest.repos.getCommit.mockResolvedValue({
      data: { author: { login: 'dependabot[bot]' }, files: [{ filename: 'src/main.js' }] },
    });
    await run({ github, context, core });
    expect(core.getOutput('is_relevant')).toBe('false');
  });

  it('sets is_relevant=true for files in docs/ path', async () => {
    github.rest.repos.getCommit.mockResolvedValue({
      data: { files: [{ filename: 'docs/GETTING_STARTED.md' }] },
    });
    await run({ github, context, core });
    expect(core.getOutput('is_relevant')).toBe('true');
  });

  it('sets is_relevant=true for files matching docFiles keywords (e.g. CONTRIBUTING)', async () => {
    github.rest.repos.getCommit.mockResolvedValue({
      data: { files: [{ filename: 'CONTRIBUTING' }] },
    });
    await run({ github, context, core });
    expect(core.getOutput('is_relevant')).toBe('true');
  });

  it('sets changed_files output to JSON array of filenames', async () => {
    github.rest.repos.getCommit.mockResolvedValue({
      data: { files: [{ filename: 'src/main.js' }, { filename: 'README.md' }] },
    });
    await run({ github, context, core });
    const changedFiles = JSON.parse(core.getOutput('changed_files'));
    expect(changedFiles).toEqual(['src/main.js', 'README.md']);
  });

  it('uses OVERRIDE_SHA env var when set', async () => {
    process.env.OVERRIDE_SHA = 'deadbeef';
    github.rest.repos.getCommit.mockResolvedValue({
      data: { files: [{ filename: 'src/main.js' }] },
    });
    await run({ github, context, core });
    expect(github.rest.repos.getCommit).toHaveBeenCalledWith(
      expect.objectContaining({ ref: 'deadbeef' })
    );
    delete process.env.OVERRIDE_SHA;
  });
});
