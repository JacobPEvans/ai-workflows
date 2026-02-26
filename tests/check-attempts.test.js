const { createMockCore, createMockContext, createMockGithub } = require('./helpers.js');
const run = require('../.github/scripts/ci-fix/check-attempts.js');

const MARKER = '<!-- claude-ci-fix-attempt -->';

describe('check-attempts', () => {
  let core, context, github;

  beforeEach(() => {
    core = createMockCore();
    context = createMockContext();
    github = createMockGithub();
    process.env.PR_NUMBER = '42';
  });

  it('sets should_run=true and attempt=1 with no prior attempts', async () => {
    github.paginate.mockResolvedValue([{ body: 'unrelated comment' }]);
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('true');
    expect(core.getOutput('attempt')).toBe('1');
  });

  it('sets should_run=true and attempt=2 with one prior attempt', async () => {
    github.paginate.mockResolvedValue([{ body: MARKER }]);
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('true');
    expect(core.getOutput('attempt')).toBe('2');
  });

  it('sets should_run=false when 2 attempt markers found', async () => {
    github.paginate.mockResolvedValue([{ body: MARKER }, { body: MARKER }]);
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('false');
    expect(core.getOutput('attempt')).toBe('2');
  });

  it('null body comment does not throw (bug fix)', async () => {
    github.paginate.mockResolvedValue([{ body: null }, { body: MARKER }]);
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('true');
  });

  it('calls setFailed when PR_NUMBER is invalid', async () => {
    process.env.PR_NUMBER = 'invalid';
    await run({ github, context, core });
    expect(core.setFailed).toHaveBeenCalled();
  });
});
