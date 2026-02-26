const { createMockCore, createMockContext, createMockGithub } = require('./helpers.js');
const run = require('../.github/scripts/ci-fix/get-failure-logs.js');

describe('get-failure-logs', () => {
  let core, context, github;

  beforeEach(() => {
    core = createMockCore();
    context = createMockContext({ payload: { workflow_run: { id: 999 } } });
    github = createMockGithub();
  });

  it('returns logs from failed jobs', async () => {
    github.paginate.mockResolvedValue([
      { name: 'build', conclusion: 'failure', id: 1 },
      { name: 'test', conclusion: 'success', id: 2 },
    ]);
    github.rest.actions.downloadJobLogsForWorkflowRun.mockResolvedValue({
      data: 'line1\nline2\nerror here',
    });
    await run({ github, context, core });
    const logs = core.getOutput('logs');
    expect(logs).toContain('FAILED JOB: build');
    expect(logs).toContain('error here');
    expect(logs).not.toContain('FAILED JOB: test');
  });

  it('sets empty output when no failed jobs', async () => {
    github.paginate.mockResolvedValue([{ name: 'build', conclusion: 'success', id: 1 }]);
    await run({ github, context, core });
    expect(core.getOutput('logs')).toBe('');
  });
});
