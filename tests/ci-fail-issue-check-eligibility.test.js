const { createMockCore, createMockContext, createMockGithub } = require('./helpers.js');
const run = require('../.github/scripts/ci-fail-issue/check-eligibility.js');

const FULL_SHA = 'abc123def456abc123def456abc123def456abc1';
const SHORT_SHA = FULL_SHA.slice(0, 7);
const RUN_URL = 'https://github.com/test-owner/test-repo/actions/runs/999';
const MARKER = '<!-- ci-fail-issue -->';

function makeContext(conclusionOverride = 'failure') {
  return createMockContext({
    payload: {
      workflow_run: {
        conclusion: conclusionOverride,
        head_sha: FULL_SHA,
        html_url: RUN_URL,
      },
    },
  });
}

describe('ci-fail-issue/check-eligibility', () => {
  let core, context, github;

  beforeEach(() => {
    core = createMockCore();
    context = makeContext();
    github = createMockGithub();

    // Default: getCommit returns a human author
    github.rest.repos.getCommit.mockResolvedValue({
      data: { author: { login: 'some-human' } },
    });

    // Default: no recent issues for all paginate calls
    // (Gate 0 calls paginate twice for botLogins; Gates 4/5 call it once)
    github.paginate.mockResolvedValue([]);
  });

  // --- Gate 0: daily bot issue ceiling ---

  it('Gate 0: sets eligible=false when ceiling is reached (5 bot issues already created)', async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    // 3 issues for claude[bot], 2 issues for github-actions[bot] = 5 total
    const claudeIssues = [
      { pull_request: undefined, created_at: new Date().toISOString() },
      { pull_request: undefined, created_at: new Date().toISOString() },
      { pull_request: undefined, created_at: new Date().toISOString() },
    ];
    const actionsIssues = [
      { pull_request: undefined, created_at: new Date().toISOString() },
      { pull_request: undefined, created_at: new Date().toISOString() },
    ];
    // Gate 0 calls paginate for each bot; Gate 4/5 call paginate once
    github.paginate
      .mockResolvedValueOnce(claudeIssues)
      .mockResolvedValueOnce(actionsIssues)
      .mockResolvedValue([]); // fallback for subsequent calls

    await run({ github, context, core });

    expect(core.getOutput('eligible')).toBe('false');
    expect(core.getOutput('skip_reason')).toContain('Daily bot activity limit reached');
    expect(core.getOutput('skip_reason')).toContain('5');
  });

  it('Gate 0: allows through when ceiling is not reached (4 or fewer bot issues)', async () => {
    // 2 issues for claude[bot], 2 for github-actions[bot] = 4 total (under ceiling of 5)
    const twoIssues = [
      { pull_request: undefined, created_at: new Date().toISOString() },
      { pull_request: undefined, created_at: new Date().toISOString() },
    ];
    github.paginate
      .mockResolvedValueOnce(twoIssues)  // claude[bot]
      .mockResolvedValueOnce(twoIssues)  // github-actions[bot]
      .mockResolvedValue([]);            // Gates 4/5

    await run({ github, context, core });

    expect(core.getOutput('eligible')).toBe('true');
  });

  it('Gate 0: excludes pull requests from the bot issue count', async () => {
    // 5 items but they are all PRs — should not count toward ceiling
    const prItems = Array.from({ length: 5 }, () => ({
      pull_request: { url: 'https://github.com/pulls/1' },
      created_at: new Date().toISOString(),
    }));
    github.paginate
      .mockResolvedValueOnce(prItems)
      .mockResolvedValueOnce(prItems)
      .mockResolvedValue([]);

    await run({ github, context, core });

    expect(core.getOutput('eligible')).toBe('true');
  });

  it('Gate 0: fails closed (marks ineligible) when ceiling API call errors', async () => {
    github.paginate.mockRejectedValueOnce(new Error('API rate limit exceeded'));

    await run({ github, context, core });

    expect(core.getOutput('eligible')).toBe('false');
    expect(core.getOutput('skip_reason')).toContain('Could not verify daily bot issue ceiling');
    expect(core.infos.some(msg => msg.includes('Failing closed'))).toBe(true);
  });

  it('Gate 1: sets eligible=false when conclusion is not failure', async () => {
    context = makeContext('success');

    await run({ github, context, core });

    expect(core.getOutput('eligible')).toBe('false');
    expect(core.getOutput('skip_reason')).toContain('conclusion');
    expect(core.getOutput('skip_reason')).toContain('success');
  });

  it('Gate 2: sets eligible=false when commit authored by copilot[bot]', async () => {
    github.rest.repos.getCommit.mockResolvedValue({
      data: { author: { login: 'copilot[bot]' } },
    });

    await run({ github, context, core });

    expect(core.getOutput('eligible')).toBe('false');
    expect(core.getOutput('skip_reason')).toContain('copilot[bot]');
  });

  it('Gate 3: sets eligible=false when commit authored by github-actions[bot]', async () => {
    github.rest.repos.getCommit.mockResolvedValue({
      data: { author: { login: 'github-actions[bot]' } },
    });

    await run({ github, context, core });

    expect(core.getOutput('eligible')).toBe('false');
    expect(core.getOutput('skip_reason')).toContain('github-actions[bot]');
  });

  it('Gate 4: sets eligible=false when an existing issue matches SHA and marker', async () => {
    github.paginate.mockResolvedValue([
      {
        number: 42,
        body: `Some issue body\n${FULL_SHA}\n${MARKER}`,
      },
    ]);

    await run({ github, context, core });

    expect(core.getOutput('eligible')).toBe('false');
    expect(core.getOutput('skip_reason')).toContain('duplicate');
    expect(core.getOutput('skip_reason')).toContain('42');
  });

  it('Gate 4: does not skip when recent issue lacks marker', async () => {
    github.paginate.mockResolvedValue([
      {
        number: 99,
        body: `Some issue body containing ${FULL_SHA} but no marker`,
      },
    ]);

    await run({ github, context, core });

    // Issue has SHA but no marker — not a ci-fail issue, should proceed past Gate 4
    expect(core.getOutput('eligible')).toBe('true');
  });

  it('Gate 5: sets eligible=false when daily limit of 3 is reached', async () => {
    github.paginate.mockResolvedValue([
      { body: `Issue one\n${MARKER}` },
      { body: `Issue two\n${MARKER}` },
      { body: `Issue three\n${MARKER}` },
    ]);

    await run({ github, context, core });

    expect(core.getOutput('eligible')).toBe('false');
    expect(core.getOutput('skip_reason')).toContain('daily limit');
    expect(core.getOutput('skip_reason')).toContain('3/3');
  });

  it('Gate 5: does not skip when recent issues lack marker', async () => {
    github.paginate.mockResolvedValue([
      { body: 'Issue one, no marker' },
      { body: 'Issue two, no marker' },
      { body: 'Issue three, no marker' },
    ]);

    await run({ github, context, core });

    expect(core.getOutput('eligible')).toBe('true');
  });

  it('happy path: sets eligible=true and all outputs when all gates pass', async () => {
    await run({ github, context, core });

    expect(core.getOutput('eligible')).toBe('true');
    expect(core.getOutput('skip_reason')).toBe('');
    expect(core.getOutput('commit_sha')).toBe(FULL_SHA);
    expect(core.getOutput('run_url')).toBe(RUN_URL);
  });

  it('bonus: proceeds when getCommit throws, treating authorLogin as empty', async () => {
    github.rest.repos.getCommit.mockRejectedValue(new Error('API timeout'));

    await run({ github, context, core });

    // authorLogin defaults to '' which is not in botAuthors — should proceed
    expect(core.getOutput('eligible')).toBe('true');
    // Warning should be logged
    expect(core.infos.some(msg => msg.includes('Could not get commit author'))).toBe(true);
  });
});
