const { createMockCore, createMockContext, createMockGithub } = require('./helpers.js');
const run = require('../.github/scripts/final-pr-review/add-label.js');

describe('add-label', () => {
  let core, context, github;

  beforeEach(() => {
    core = createMockCore();
    context = createMockContext();
    github = createMockGithub();
    process.env.PR_NUMBER = '99';
  });

  it('adds ai:reviewed label to valid PR', async () => {
    github.rest.issues.addLabels.mockResolvedValue({});
    await run({ github, context, core });
    expect(github.rest.issues.addLabels).toHaveBeenCalledWith(
      expect.objectContaining({ issue_number: 99, labels: ['ai:reviewed'] })
    );
  });

  it('calls setFailed when PR_NUMBER is not a number (bug fix)', async () => {
    process.env.PR_NUMBER = 'not-a-number';
    await run({ github, context, core });
    expect(core.setFailed).toHaveBeenCalled();
    expect(github.rest.issues.addLabels).not.toHaveBeenCalled();
  });

  it('calls setFailed when PR_NUMBER is missing (bug fix)', async () => {
    delete process.env.PR_NUMBER;
    await run({ github, context, core });
    expect(core.setFailed).toHaveBeenCalled();
    expect(github.rest.issues.addLabels).not.toHaveBeenCalled();
  });
});
