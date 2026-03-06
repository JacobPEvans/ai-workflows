const { createMockCore, createMockContext, createMockGithub } = require('./helpers.js');
const run = require('../.github/scripts/shared/check-daily-limit.js');

describe('check-daily-limit', () => {
  let core, context, github;

  beforeEach(() => {
    core = createMockCore();
    context = createMockContext();
    github = createMockGithub();
    delete process.env.DAILY_RUN_LIMIT;
    delete process.env.WORKFLOW_FILE;
  });

  it('sets should_run=true when under the daily limit', async () => {
    process.env.WORKFLOW_FILE = 'JacobPEvans/ai-workflows/.github/workflows/code-simplifier.yml@refs/heads/main';
    process.env.DAILY_RUN_LIMIT = '5';

    const now = new Date();
    const recentRun = { created_at: new Date(now - 60 * 60 * 1000).toISOString() }; // 1 hour ago
    github.rest.actions.listWorkflowRuns.mockResolvedValue({
      data: { workflow_runs: [recentRun, recentRun] }, // 2 runs
    });

    await run({ github, context, core });

    expect(core.getOutput('should_run')).toBe('true');
    expect(core.failures).toHaveLength(0);
  });

  it('calls setFailed when daily limit is reached', async () => {
    process.env.WORKFLOW_FILE = 'JacobPEvans/ai-workflows/.github/workflows/code-simplifier.yml@refs/heads/main';
    process.env.DAILY_RUN_LIMIT = '3';

    const now = new Date();
    const recentRun = { created_at: new Date(now - 60 * 60 * 1000).toISOString() }; // 1 hour ago
    github.rest.actions.listWorkflowRuns.mockResolvedValue({
      data: { workflow_runs: [recentRun, recentRun, recentRun] }, // 3 runs = limit
    });

    await run({ github, context, core });

    expect(core.failures).toHaveLength(1);
    expect(core.failures[0]).toMatch(/Daily limit reached \(3\/3/);
    expect(core.getOutput('should_run')).toBeUndefined();
  });

  it('excludes runs older than 24 hours from count', async () => {
    process.env.WORKFLOW_FILE = 'owner/repo/.github/workflows/test.yml@refs/heads/main';
    process.env.DAILY_RUN_LIMIT = '5';

    const now = new Date();
    const recentRun = { created_at: new Date(now - 60 * 60 * 1000).toISOString() }; // 1 hour ago
    const oldRun = { created_at: new Date(now - 25 * 60 * 60 * 1000).toISOString() }; // 25 hours ago
    github.rest.actions.listWorkflowRuns.mockResolvedValue({
      data: { workflow_runs: [recentRun, oldRun, oldRun, oldRun, oldRun] }, // 1 recent + 4 old
    });

    await run({ github, context, core });

    expect(core.getOutput('should_run')).toBe('true');
    expect(core.failures).toHaveLength(0);
  });

  it('disables limit when DAILY_RUN_LIMIT=0', async () => {
    process.env.DAILY_RUN_LIMIT = '0';
    process.env.WORKFLOW_FILE = 'owner/repo/.github/workflows/test.yml@refs/heads/main';

    await run({ github, context, core });

    expect(core.getOutput('should_run')).toBe('true');
    expect(github.rest.actions.listWorkflowRuns.mock.calls).toHaveLength(0);
  });

  it('extracts workflow file name from workflow_ref', async () => {
    process.env.WORKFLOW_FILE = 'JacobPEvans/ai-workflows/.github/workflows/best-practices.yml@refs/heads/main';
    process.env.DAILY_RUN_LIMIT = '5';

    github.rest.actions.listWorkflowRuns.mockResolvedValue({
      data: { workflow_runs: [] },
    });

    await run({ github, context, core });

    const call = github.rest.actions.listWorkflowRuns.mock.calls[0][0];
    expect(call.workflow_id).toBe('best-practices.yml');
  });

  it('defaults to limit of 5 when DAILY_RUN_LIMIT is not set', async () => {
    process.env.WORKFLOW_FILE = 'owner/repo/.github/workflows/test.yml@refs/heads/main';

    github.rest.actions.listWorkflowRuns.mockResolvedValue({
      data: { workflow_runs: [] },
    });

    await run({ github, context, core });

    expect(core.getOutput('should_run')).toBe('true');
  });
});
