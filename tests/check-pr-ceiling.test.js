const { createMockCore, createMockContext, createMockGithub } = require('./helpers.js');
const run = require('../.github/scripts/shared/check-pr-ceiling.js');

// Helper: wrap PR data arrays into the async iterator format that paginate.iterator returns
function mockPaginateIterator(pages) {
  return async function* () {
    for (const page of pages) {
      yield { data: page };
    }
  };
}

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
    github.paginate.iterator.mockReturnValue(mockPaginateIterator([[
      { user: { login: 'claude[bot]' }, created_at: new Date(now - 60 * 60 * 1000).toISOString() },
      { user: { login: 'github-actions[bot]' }, created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString() },
    ]])());

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('true');
  });

  it('blocks when at the default ceiling of 5', async () => {
    const now = new Date();
    const recentBotPR = (login) => ({
      user: { login },
      created_at: new Date(now - 60 * 60 * 1000).toISOString(),
    });
    github.paginate.iterator.mockReturnValue(mockPaginateIterator([[
      recentBotPR('claude[bot]'),
      recentBotPR('claude[bot]'),
      recentBotPR('claude[bot]'),
      recentBotPR('github-actions[bot]'),
      recentBotPR('github-actions[bot]'),
    ]])());

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('false');
    expect(core.infos.some(m => m.includes('ceiling reached'))).toBe(true);
  });

  it('excludes PRs older than 24 hours', async () => {
    const now = new Date();
    github.paginate.iterator.mockReturnValue(mockPaginateIterator([[
      { user: { login: 'claude[bot]' }, created_at: new Date(now - 60 * 60 * 1000).toISOString() },
      { user: { login: 'claude[bot]' }, created_at: new Date(now - 25 * 60 * 60 * 1000).toISOString() },
      { user: { login: 'claude[bot]' }, created_at: new Date(now - 48 * 60 * 60 * 1000).toISOString() },
      { user: { login: 'github-actions[bot]' }, created_at: new Date(now - 30 * 60 * 60 * 1000).toISOString() },
    ]])());

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('true');
  });

  it('fails open on API error', async () => {
    github.paginate.iterator.mockReturnValue((async function* () {
      throw new Error('API rate limit');
    })());

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('true');
    expect(core.infos.some(m => m.includes('Failing open'))).toBe(true);
  });

  it('respects configurable ceiling via PR_DAILY_CEILING env var', async () => {
    process.env.PR_DAILY_CEILING = '2';
    const now = new Date();
    github.paginate.iterator.mockReturnValue(mockPaginateIterator([[
      { user: { login: 'claude[bot]' }, created_at: new Date(now - 60 * 60 * 1000).toISOString() },
      { user: { login: 'claude[bot]' }, created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString() },
    ]])());

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('false');
    expect(core.infos.some(m => m.includes('2/2'))).toBe(true);
  });

  it('handles PRs with null or missing user gracefully', async () => {
    const now = new Date();
    github.paginate.iterator.mockReturnValue(mockPaginateIterator([[
      { user: null, created_at: new Date(now - 60 * 60 * 1000).toISOString() },
      { user: undefined, created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString() },
      { created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString() },
      { user: { login: 'claude[bot]' }, created_at: new Date(now - 4 * 60 * 60 * 1000).toISOString() },
    ]])());

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('true');
  });

  it('ignores non-bot PRs', async () => {
    const now = new Date();
    github.paginate.iterator.mockReturnValue(mockPaginateIterator([[
      { user: { login: 'human-user' }, created_at: new Date(now - 60 * 60 * 1000).toISOString() },
      { user: { login: 'human-user' }, created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString() },
      { user: { login: 'human-user' }, created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString() },
      { user: { login: 'human-user' }, created_at: new Date(now - 4 * 60 * 60 * 1000).toISOString() },
      { user: { login: 'human-user' }, created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString() },
      { user: { login: 'claude[bot]' }, created_at: new Date(now - 60 * 60 * 1000).toISOString() },
    ]])());

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('true');
  });

  it('paginates across multiple pages', async () => {
    const now = new Date();
    const recentBotPR = (login) => ({
      user: { login },
      created_at: new Date(now - 60 * 60 * 1000).toISOString(),
    });
    // 3 bot PRs on page 1, 2 bot PRs on page 2 = 5 total (hits ceiling)
    github.paginate.iterator.mockReturnValue(mockPaginateIterator([
      [recentBotPR('claude[bot]'), recentBotPR('claude[bot]'), recentBotPR('claude[bot]')],
      [recentBotPR('github-actions[bot]'), recentBotPR('github-actions[bot]')],
    ])());

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('false');
    expect(core.infos.some(m => m.includes('ceiling reached'))).toBe(true);
  });

  it('stops pagination early when all PRs on a page are older than 24h', async () => {
    const now = new Date();
    const recentPR = { user: { login: 'claude[bot]' }, created_at: new Date(now - 60 * 60 * 1000).toISOString() };
    const oldPR = { user: { login: 'claude[bot]' }, created_at: new Date(now - 25 * 60 * 60 * 1000).toISOString() };
    // Page 1 has recent PRs, page 2 has only old PRs — should stop and not reach page 3
    github.paginate.iterator.mockReturnValue(mockPaginateIterator([
      [recentPR],
      [oldPR, oldPR],
      [recentPR, recentPR, recentPR, recentPR, recentPR],  // would hit ceiling if reached
    ])());

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('true');
    expect(core.infos.some(m => m.includes('1/5'))).toBe(true);
  });

  it('falls back to default ceiling when PR_DAILY_CEILING is NaN', async () => {
    process.env.PR_DAILY_CEILING = 'abc';
    const now = new Date();
    github.paginate.iterator.mockReturnValue(mockPaginateIterator([[
      { user: { login: 'claude[bot]' }, created_at: new Date(now - 60 * 60 * 1000).toISOString() },
    ]])());

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('true');
    // Should use default of 5, showing 1/5
    expect(core.infos.some(m => m.includes('1/5'))).toBe(true);
  });

  it('falls back to default ceiling when PR_DAILY_CEILING is zero', async () => {
    process.env.PR_DAILY_CEILING = '0';
    const now = new Date();
    github.paginate.iterator.mockReturnValue(mockPaginateIterator([[
      { user: { login: 'claude[bot]' }, created_at: new Date(now - 60 * 60 * 1000).toISOString() },
    ]])());

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('true');
    expect(core.infos.some(m => m.includes('1/5'))).toBe(true);
  });

  it('falls back to default ceiling when PR_DAILY_CEILING is negative', async () => {
    process.env.PR_DAILY_CEILING = '-3';
    const now = new Date();
    github.paginate.iterator.mockReturnValue(mockPaginateIterator([[
      { user: { login: 'claude[bot]' }, created_at: new Date(now - 60 * 60 * 1000).toISOString() },
    ]])());

    await run({ github, context, core });

    expect(core.getOutput('allowed')).toBe('true');
    expect(core.infos.some(m => m.includes('1/5'))).toBe(true);
  });
});
