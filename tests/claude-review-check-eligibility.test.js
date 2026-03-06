const { createMockCore, createMockContext, createMockGithub } = require('./helpers.js');
const run = require('../.github/scripts/claude-review/check-eligibility.js');

describe('claude-review/check-eligibility', () => {
  let core, context, github;

  beforeEach(() => {
    core = createMockCore();
    context = createMockContext();
    github = createMockGithub();
    process.env.PR_NUMBER = '42';
    delete process.env.MAX_REVIEWS;
  });

  it('sets eligible=false when no PR_NUMBER provided', async () => {
    delete process.env.PR_NUMBER;
    await run({ github, context, core });
    expect(core.getOutput('eligible')).toBe('false');
  });

  it('sets eligible=false when PR_NUMBER is zero', async () => {
    process.env.PR_NUMBER = '0';
    await run({ github, context, core });
    expect(core.getOutput('eligible')).toBe('false');
  });

  it('sets eligible=true when max_reviews=0 (unlimited)', async () => {
    process.env.MAX_REVIEWS = '0';
    await run({ github, context, core });
    expect(core.getOutput('eligible')).toBe('true');
  });

  it('sets eligible=false when max_reviews is negative', async () => {
    process.env.MAX_REVIEWS = '-1';
    await run({ github, context, core });
    expect(core.getOutput('eligible')).toBe('false');
  });

  it('sets eligible=true when no prior Claude reviews', async () => {
    github.paginate.mockResolvedValue([
      { user: { login: 'some-user', type: 'User' }, body: 'not a claude comment' },
    ]);
    await run({ github, context, core });
    expect(core.getOutput('eligible')).toBe('true');
  });

  it('sets eligible=false when Claude review count meets max_reviews', async () => {
    process.env.MAX_REVIEWS = '1';
    github.paginate.mockResolvedValue([
      { user: { login: 'claude[bot]', type: 'Bot' }, body: 'Claude review' },
    ]);
    await run({ github, context, core });
    expect(core.getOutput('eligible')).toBe('false');
  });

  it('sets eligible=true when Claude review count is below max_reviews', async () => {
    process.env.MAX_REVIEWS = '2';
    github.paginate.mockResolvedValue([
      { user: { login: 'claude[bot]', type: 'Bot' }, body: 'Claude review' },
    ]);
    await run({ github, context, core });
    expect(core.getOutput('eligible')).toBe('true');
  });

  it('ignores non-bot comments from claude[bot] login', async () => {
    process.env.MAX_REVIEWS = '1';
    github.paginate.mockResolvedValue([
      { user: { login: 'claude[bot]', type: 'User' }, body: 'spoofed comment' },
    ]);
    await run({ github, context, core });
    expect(core.getOutput('eligible')).toBe('true');
  });
});
