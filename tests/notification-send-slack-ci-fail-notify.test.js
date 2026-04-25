const { mock, beforeEach, describe, it, expect } = require('bun:test');
const { createMockCore, createMockContext, createMockGithub } = require('./helpers.js');

let mockFetch;

describe('send-slack-ci-fail-notify', () => {
  let core, context, github;

  beforeEach(() => {
    core = createMockCore();
    context = createMockContext();
    github = createMockGithub();

    delete process.env.SLACK_WEBHOOK_URL;
    delete process.env.WORKFLOW_NAME;
    delete process.env.RUN_URL;
    delete process.env.RUN_ID;
    delete process.env.HEAD_SHA;
    delete process.env.HEAD_BRANCH;
    delete process.env.REPO_NAME;
    delete process.env.CONCLUSION;
    delete process.env.EVENT_NAME;

    mockFetch = mock(() => Promise.resolve({ ok: true, status: 200, statusText: 'OK' }));
    global.fetch = mockFetch;
  });

  it('sends CI failure notification with all fields', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    process.env.WORKFLOW_NAME = 'CI / test';
    process.env.RUN_URL = 'https://github.com/owner/repo/actions/runs/99';
    process.env.RUN_ID = '99';
    process.env.HEAD_SHA = 'abc1234def5678';
    process.env.HEAD_BRANCH = 'main';
    process.env.REPO_NAME = 'owner/repo';
    process.env.CONCLUSION = 'failure';
    process.env.EVENT_NAME = 'push';

    const run = require('../.github/scripts/notification/send-slack-ci-fail-notify.js');
    await run({ github, context, core });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://hooks.slack.com/test');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body);
    expect(body.blocks).toBeDefined();
    expect(body.blocks[0].type).toBe('header');
    expect(body.blocks[0].text.text).toContain('CI Failure');

    const fields = body.blocks[2].fields;
    const fieldTexts = fields.map((f) => f.text);
    expect(fieldTexts.some((t) => t.includes('main'))).toBe(true);
    expect(fieldTexts.some((t) => t.includes('abc1234'))).toBe(true);
    expect(fieldTexts.some((t) => t.includes('push'))).toBe(true);
    expect(fieldTexts.some((t) => t.includes('failure'))).toBe(true);

    expect(core.failures).toHaveLength(0);
    expect(core.infos.some((m) => m.includes('owner/repo'))).toBe(true);
  });

  it('calls setFailed when Slack webhook returns non-ok status', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    process.env.WORKFLOW_NAME = 'CI';
    process.env.RUN_URL = 'https://github.com/owner/repo/actions/runs/1';
    process.env.RUN_ID = '1';
    process.env.HEAD_SHA = 'aaa';
    process.env.HEAD_BRANCH = 'main';
    process.env.REPO_NAME = 'owner/repo';
    process.env.CONCLUSION = 'failure';
    process.env.EVENT_NAME = 'push';

    mockFetch = mock(() => Promise.resolve({ ok: false, status: 500, statusText: 'Internal Server Error' }));
    global.fetch = mockFetch;

    const run = require('../.github/scripts/notification/send-slack-ci-fail-notify.js');
    await run({ github, context, core });

    expect(core.failures).toHaveLength(1);
    expect(core.failures[0]).toContain('500');
  });

  it('calls setFailed on network error', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    process.env.WORKFLOW_NAME = 'CI';
    process.env.RUN_URL = 'https://github.com/owner/repo/actions/runs/1';
    process.env.RUN_ID = '1';
    process.env.HEAD_SHA = 'aaa';
    process.env.HEAD_BRANCH = 'main';
    process.env.REPO_NAME = 'owner/repo';
    process.env.CONCLUSION = 'failure';
    process.env.EVENT_NAME = 'push';

    mockFetch = mock(() => Promise.reject(new Error('ECONNREFUSED')));
    global.fetch = mockFetch;

    const run = require('../.github/scripts/notification/send-slack-ci-fail-notify.js');
    await run({ github, context, core });

    expect(core.failures).toHaveLength(1);
    expect(core.failures[0]).toContain('ECONNREFUSED');
  });
});
