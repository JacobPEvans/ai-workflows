const { mock, beforeEach, afterEach, describe, it, expect } = require('bun:test');
const { createMockCore, createMockContext, createMockGithub } = require('./helpers.js');

// Store reference to the mock fetch for assertions
let mockFetch;

// Mock fetch globally before requiring the module
const originalFetch = global.fetch;

describe('send-slack-pr-notify', () => {
  let core, context, github;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    core = createMockCore();
    context = createMockContext();
    github = createMockGithub();

    // Reset env vars
    delete process.env.SLACK_WEBHOOK_URL;
    delete process.env.PR_TITLE;
    delete process.env.PR_URL;
    delete process.env.PR_NUMBER;
    delete process.env.PR_BODY;
    delete process.env.REPO_NAME;

    // Reset fetch mock
    mockFetch = mock(() => Promise.resolve({ ok: true, status: 200, statusText: 'OK' }));
    global.fetch = mockFetch;
  });

  it('sends Slack notification with provenance from PR body', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    process.env.PR_TITLE = 'chore: simplify authentication logic';
    process.env.PR_URL = 'https://github.com/owner/repo/pull/42';
    process.env.PR_NUMBER = '42';
    process.env.REPO_NAME = 'owner/repo';
    process.env.PR_BODY = [
      '## Summary',
      '- Removed duplicate auth check',
      '',
      '---',
      '> **AI Provenance** | Workflow: `Code Simplifier` | [Run 12345678](https://github.com/owner/repo/actions/runs/12345678) | Event: `schedule` | Actor: `github-actions[bot]`',
    ].join('\n');

    const run = require('../.github/scripts/notification/send-slack-pr-notify.js');
    await run({ github, context, core });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://hooks.slack.com/test');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body);
    expect(body.blocks).toBeDefined();

    // Header block
    expect(body.blocks[0].type).toBe('header');
    expect(body.blocks[0].text.text).toBe('AI-Created PR Opened');

    // PR link section
    expect(body.blocks[1].text.text).toContain('owner/repo #42');
    expect(body.blocks[1].text.text).toContain('https://github.com/owner/repo/pull/42');

    // Provenance fields
    const fields = body.blocks[2].fields;
    const fieldTexts = fields.map((f) => f.text);
    expect(fieldTexts.some((t) => t.includes('Code Simplifier'))).toBe(true);
    expect(fieldTexts.some((t) => t.includes('schedule'))).toBe(true);
    expect(fieldTexts.some((t) => t.includes('github-actions[bot]'))).toBe(true);
    expect(fieldTexts.some((t) => t.includes('12345678'))).toBe(true);

    expect(core.failures).toHaveLength(0);
    expect(core.infos.some((m) => m.includes('#42'))).toBe(true);
  });

  it('sends notification with unknown provenance when footer is absent', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    process.env.PR_TITLE = 'fix: something';
    process.env.PR_URL = 'https://github.com/owner/repo/pull/7';
    process.env.PR_NUMBER = '7';
    process.env.REPO_NAME = 'owner/repo';
    process.env.PR_BODY = '## Summary\n- Fixed the thing';

    const run = require('../.github/scripts/notification/send-slack-pr-notify.js');
    await run({ github, context, core });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const fields = body.blocks[2].fields;
    const fieldTexts = fields.map((f) => f.text);
    expect(fieldTexts.some((t) => t.includes('unknown'))).toBe(true);
    expect(core.failures).toHaveLength(0);
  });

  it('calls setFailed when Slack webhook returns non-ok status', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    process.env.PR_TITLE = 'fix: something';
    process.env.PR_URL = 'https://github.com/owner/repo/pull/1';
    process.env.PR_NUMBER = '1';
    process.env.REPO_NAME = 'owner/repo';
    process.env.PR_BODY = '';

    mockFetch = mock(() => Promise.resolve({ ok: false, status: 500, statusText: 'Internal Server Error' }));
    global.fetch = mockFetch;

    const run = require('../.github/scripts/notification/send-slack-pr-notify.js');
    await run({ github, context, core });

    expect(core.failures).toHaveLength(1);
    expect(core.failures[0]).toContain('500');
  });
});
