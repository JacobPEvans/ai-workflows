const { createMockCore, createMockContext, createMockGithub } = require('./helpers.js');
const run = require('../.github/scripts/ci-fix/find-pr.js');

describe('find-pr', () => {
  let core, context, github;

  beforeEach(() => {
    core = createMockCore();
    context = createMockContext({
      payload: { workflow_run: { head_branch: 'feat/my-feature' } },
    });
    github = createMockGithub();
  });

  it('sets pr_number when open PR found for branch', async () => {
    github.rest.pulls.list.mockResolvedValue({ data: [{ number: 42 }] });
    await run({ github, context, core });
    expect(core.getOutput('pr_number')).toBe('42');
  });

  it('sets empty pr_number when no PR found', async () => {
    github.rest.pulls.list.mockResolvedValue({ data: [] });
    await run({ github, context, core });
    expect(core.getOutput('pr_number')).toBe('');
  });
});
