const { createMockCore, createMockContext, createMockGithub } = require('./helpers.js');
const run = require('../.github/scripts/best-practices/check-recent-activity.js');

describe('check-recent-activity', () => {
  let core, context, github;

  beforeEach(() => {
    core = createMockCore();
    context = createMockContext();
    github = createMockGithub();
  });

  it('sets should_run=true when no prior recommendation found', async () => {
    github.rest.search.issuesAndPullRequests.mockResolvedValue({
      data: { items: [] },
    });
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('true');
  });

  it('sets should_run=false when only bot commits since last recommendation', async () => {
    github.rest.search.issuesAndPullRequests.mockResolvedValue({
      data: { items: [{ created_at: '2024-01-01T00:00:00Z' }] },
    });
    const botCommit = {
      author: { type: 'Bot', login: 'github-actions[bot]' },
      commit: { author: { name: 'GitHub Actions', email: 'actions@noreply.github.com' } },
    };
    async function* mockIterator() {
      yield { data: [botCommit] };
    }
    github.paginate.iterator.mockReturnValue(mockIterator());
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('false');
  });

  it('sets should_run=true when human commit found since last recommendation', async () => {
    github.rest.search.issuesAndPullRequests.mockResolvedValue({
      data: { items: [{ created_at: '2024-01-01T00:00:00Z' }] },
    });
    const humanCommit = {
      author: { type: 'User', login: 'johndoe' },
      commit: { author: { name: 'John Doe', email: 'john@example.com' } },
    };
    async function* mockIterator() {
      yield { data: [humanCommit] };
    }
    github.paginate.iterator.mockReturnValue(mockIterator());
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('true');
  });
});
