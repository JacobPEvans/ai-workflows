# ai-workflows Local Claude Instructions

## Package Manager: bun (NOT npm)

This project uses **bun** as the package manager and test runner. Never use npm or npx.

- bun is globally available via Nix (no install needed)
- `bun test` runs the test suite directly — no `bun install` required
- `bun:test` is bun's built-in test runner; no external test framework dependencies

### Test Commands

```bash
bun test           # Run all tests once
bun test --watch   # Watch mode during development
```

### Why Not npm?

This environment is managed by Nix (see `~/git/nix-config/`). bun is installed
via Nix configuration. npm is not the project's package manager of choice.

## Test Infrastructure

- Framework: bun:test (built-in — no devDependencies needed)
- Helpers: `tests/helpers.js` — mock factories for github, context, core
- All tests in `tests/*.test.js` — one file per script in `.github/scripts/`
- CI: `.github/workflows/test.yml` uses `oven-sh/setup-bun@v2`

## Writing Tests

Import bun test globals (no explicit import needed in test files):

```js
// describe, it, expect, beforeEach are globals in bun:test
const { createMockCore, createMockContext, createMockGithub } = require('./helpers.js');
const run = require('../.github/scripts/<dir>/<script>.js');

describe('<script-name>', () => {
  let core, context, github;
  beforeEach(() => {
    core = createMockCore();
    context = createMockContext();
    github = createMockGithub();
  });
  it('happy path', async () => {
    await run({ github, context, core });
    expect(core.getOutput('key')).toBe('expected');
  });
});
```

Use `mock()` from `bun:test` for mock functions (replaces `vi.fn()`):

```js
const { mock } = require('bun:test');
const fn = mock();
fn.mockResolvedValueOnce(value);
fn.mockResolvedValue(value);
```
