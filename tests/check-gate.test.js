const { createMockCore, createMockContext, createMockGithub } = require('./helpers.js');
const run = require('../.github/scripts/final-pr-review/check-gate.js');

describe('check-gate', () => {
  let core, context, github;

  function buildPr(overrides = {}) {
    return {
      state: 'open',
      draft: false,
      mergeable: true,
      labels: [],
      head: { sha: 'sha123' },
      ...overrides,
    };
  }

  beforeEach(() => {
    core = createMockCore();
    context = createMockContext({ payload: { pull_request: { number: 10 } } });
    github = createMockGithub();
    github.rest.pulls.get.mockResolvedValue({ data: buildPr() });
    github.rest.pulls.listReviews.mockResolvedValue({
      data: [{ user: { type: 'User' }, state: 'APPROVED' }],
    });
    github.rest.checks.listForRef.mockResolvedValue({
      data: { check_runs: [] },
    });
  });

  it('sets should_run=true when all gates pass', async () => {
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('true');
    expect(core.getOutput('pr_number')).toBe('10');
  });

  it('sets should_run=false when no PR in event payload', async () => {
    context.payload = {};
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('false');
  });

  it('sets should_run=false for draft PR (gate 1)', async () => {
    github.rest.pulls.get.mockResolvedValue({ data: buildPr({ draft: true }) });
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('false');
  });

  it('sets should_run=false for closed PR (gate 1)', async () => {
    github.rest.pulls.get.mockResolvedValue({ data: buildPr({ state: 'closed' }) });
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('false');
  });

  it('sets should_run=false when PR has merge conflicts (gate 2)', async () => {
    github.rest.pulls.get.mockResolvedValue({ data: buildPr({ mergeable: false }) });
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('false');
  });

  it('sets should_run=false when ai:reviewed label present (gate 3)', async () => {
    github.rest.pulls.get.mockResolvedValue({
      data: buildPr({ labels: [{ name: 'ai:reviewed' }] }),
    });
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('false');
  });

  it('sets should_run=false when ai:skip-review label present (gate 4)', async () => {
    github.rest.pulls.get.mockResolvedValue({
      data: buildPr({ labels: [{ name: 'ai:skip-review' }] }),
    });
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('false');
  });

  it('sets should_run=false with no human reviews (gate 5)', async () => {
    github.rest.pulls.listReviews.mockResolvedValue({ data: [] });
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('false');
  });

  it('sets should_run=false with pending checks (gate 6)', async () => {
    github.rest.checks.listForRef.mockResolvedValue({
      data: { check_runs: [{ name: 'Tests', status: 'in_progress', conclusion: null }] },
    });
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('false');
  });

  it('sets should_run=false with failed checks (gate 6)', async () => {
    github.rest.checks.listForRef.mockResolvedValue({
      data: { check_runs: [{ name: 'Tests', status: 'completed', conclusion: 'failure' }] },
    });
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('false');
  });

  it('null user on review does not throw (bug fix)', async () => {
    github.rest.pulls.listReviews.mockResolvedValue({
      data: [
        { user: null, state: 'APPROVED' },
        { user: { type: 'User' }, state: 'APPROVED' },
      ],
    });
    await run({ github, context, core });
    expect(core.getOutput('should_run')).toBe('true');
  });
});
