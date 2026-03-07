const { createMockCore, createMockContext, createMockGithub } = require('./helpers.js');
const run = require('../.github/scripts/shared/check-pr-ceiling.js');

describe('check-pr-ceiling', () => {
  let core, context, github;

  beforeEach(() => {
    core = createMockCore();
    context = createMockContext();
    github = createMockGithub();
    delete process.env.PR_DAILY_CEILING;
  });

  it('allows when under the default ceiling of 5', async () => {
    const now = new Date();
    github.rest.pulls.list.mockResolvedValue({
      data: [
        { user: { login: 'claude[bot]' }, created_at: new Date(now - 60 * 60 * 1000).toISOString() },
        { user: { login: 'github-actions[bot]' }, created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString() },
      ],
    });

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('true');
  });

  it('blocks when at the default ceiling of 5', async () => {
    const now = new Date();
    const recentBotPR = (login) => ({
      user: { login },
      created_at: new Date(now - 60 * 60 * 1000).toISOString(),
    });
    github.rest.pulls.list.mockResolvedValue({
      data: [
        recentBotPR('claude[bot]'),
        recentBotPR('claude[bot]'),
        recentBotPR('claude[bot]'),
        recentBotPR('github-actions[bot]'),
        recentBotPR('github-actions[bot]'),
      ],
    });

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('false');
    expect(core.infos.some(m => m.includes('ceiling reached'))).toBe(true);
  });

  it('excludes PRs older than 24 hours', async () => {
    const now = new Date();
    github.rest.pulls.list.mockResolvedValue({
      data: [
        { user: { login: 'claude[bot]' }, created_at: new Date(now - 60 * 60 * 1000).toISOString() },
        { user: { login: 'claude[bot]' }, created_at: new Date(now - 25 * 60 * 60 * 1000).toISOString() },
        { user: { login: 'claude[bot]' }, created_at: new Date(now - 48 * 60 * 60 * 1000).toISOString() },
        { user: { login: 'github-actions[bot]' }, created_at: new Date(now - 30 * 60 * 60 * 1000).toISOString() },
      ],
    });

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('true');
  });

  it('fails open on API error', async () => {
    github.rest.pulls.list.mockRejectedValue(new Error('API rate limit'));

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('true');
    expect(core.infos.some(m => m.includes('Failing open'))).toBe(true);
  });

  it('respects configurable ceiling via PR_DAILY_CEILING env var', async () => {
    process.env.PR_DAILY_CEILING = '2';
    const now = new Date();
    github.rest.pulls.list.mockResolvedValue({
      data: [
        { user: { login: 'claude[bot]' }, created_at: new Date(now - 60 * 60 * 1000).toISOString() },
        { user: { login: 'claude[bot]' }, created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString() },
      ],
    });

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('false');
    expect(core.infos.some(m => m.includes('2/2'))).toBe(true);
  });

  it('handles PRs with null or missing user gracefully', async () => {
    const now = new Date();
    github.rest.pulls.list.mockResolvedValue({
      data: [
        { user: null, created_at: new Date(now - 60 * 60 * 1000).toISOString() },
        { user: undefined, created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString() },
        { created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString() },
        { user: { login: 'claude[bot]' }, created_at: new Date(now - 4 * 60 * 60 * 1000).toISOString() },
      ],
    });

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('true');
  });

  it('ignores non-bot PRs', async () => {
    const now = new Date();
    github.rest.pulls.list.mockResolvedValue({
      data: [
        { user: { login: 'human-user' }, created_at: new Date(now - 60 * 60 * 1000).toISOString() },
        { user: { login: 'human-user' }, created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString() },
        { user: { login: 'human-user' }, created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString() },
        { user: { login: 'human-user' }, created_at: new Date(now - 4 * 60 * 60 * 1000).toISOString() },
        { user: { login: 'human-user' }, created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString() },
        { user: { login: 'claude[bot]' }, created_at: new Date(now - 60 * 60 * 1000).toISOString() },
      ],
    });

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('true');
  });
});
