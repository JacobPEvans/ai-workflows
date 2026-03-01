const { createMockCore, createMockContext, createMockGithub } = require('./helpers.js');
const run = require('../.github/scripts/issue-linker/check-eligibility.js');

function makePRPayload(action, merged = false, prNumber = 42) {
  return {
    action,
    pull_request: {
      number: prNumber,
      merged,
    },
  };
}

describe('issue-linker/check-eligibility', () => {
  let core, context, github;

  beforeEach(() => {
    core = createMockCore();
    context = createMockContext({ payload: makePRPayload('opened') });
    github = createMockGithub();

    // Default: one open issue exists
    github.rest.issues.listForRepo.mockResolvedValue({ data: [{ number: 1, title: 'Some issue' }] });

    // Default: no existing PR comments with dedup marker
    github.rest.issues.listComments.mockResolvedValue({ data: [] });
  });

  it('happy path: opened action with open issues and no dedup marker sets should_run=true, mode=opened', async () => {
    await run({ github, context, core });

    expect(core.getOutput('should_run')).toBe('true');
    expect(core.getOutput('mode')).toBe('opened');
    expect(core.getOutput('pr_number')).toBe('42');
  });

  it('happy path: closed+merged action with open issues and no dedup marker sets should_run=true, mode=merged', async () => {
    context.payload = makePRPayload('closed', true);

    await run({ github, context, core });

    expect(core.getOutput('should_run')).toBe('true');
    expect(core.getOutput('mode')).toBe('merged');
    expect(core.getOutput('pr_number')).toBe('42');
  });

  it('skip: closed without merging sets should_run=false', async () => {
    context.payload = makePRPayload('closed', false);

    await run({ github, context, core });

    expect(core.getOutput('should_run')).toBe('false');
  });

  it('skip: unrecognized action (synchronize) sets should_run=false', async () => {
    context.payload = makePRPayload('synchronize');

    await run({ github, context, core });

    expect(core.getOutput('should_run')).toBe('false');
  });

  it('skip: no open issues sets should_run=false', async () => {
    github.rest.issues.listForRepo.mockResolvedValue({ data: [] });

    await run({ github, context, core });

    expect(core.getOutput('should_run')).toBe('false');
  });

  it('skip: dedup marker <!-- issue-linker-opened --> in PR comments for opened mode sets should_run=false', async () => {
    github.rest.issues.listComments.mockResolvedValue({
      data: [
        { body: 'Some prior comment with <!-- issue-linker-opened --> marker' },
      ],
    });

    await run({ github, context, core });

    expect(core.getOutput('should_run')).toBe('false');
  });

  it('skip: dedup marker <!-- issue-linker-merged --> in PR comments for merged mode sets should_run=false', async () => {
    context.payload = makePRPayload('closed', true);
    github.rest.issues.listComments.mockResolvedValue({
      data: [
        { body: 'Some prior comment with <!-- issue-linker-merged --> marker' },
      ],
    });

    await run({ github, context, core });

    expect(core.getOutput('should_run')).toBe('false');
  });

  it('mode detection: opened action produces mode=opened', async () => {
    context.payload = makePRPayload('opened');

    await run({ github, context, core });

    expect(core.getOutput('mode')).toBe('opened');
  });

  it('mode detection: closed+merged action produces mode=merged', async () => {
    context.payload = makePRPayload('closed', true);

    await run({ github, context, core });

    expect(core.getOutput('mode')).toBe('merged');
  });
});
