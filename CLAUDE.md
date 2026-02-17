# ai-workflows

Reusable AI agent workflows using the Claude engine for GitHub Agentic Workflows (gh-aw).

## Workflow Authoring Rules

### File Format Separation

Never mix programming languages inline within workflow files. Each file must contain a single language:

- `.yml` files contain only YAML (workflow configuration)
- `.js` files contain only JavaScript
- `.py` files contain only Python
- `.sh` files contain only shell scripts

**Inline threshold**: Scripts of 5 lines or fewer may be embedded directly in YAML workflow steps. Scripts exceeding 5 lines must be extracted to a dedicated file under `.github/scripts/` and referenced with a short require/import.

**Pattern for extracted scripts** (`actions/github-script`):

```yaml
# Workflow YAML — 2-line loader only
- uses: actions/github-script@v7
  with:
    script: |
      const run = require('./.github/scripts/<dir>/<name>.js');
      await run({ github, context, core });
```

```javascript
// .github/scripts/<dir>/<name>.js
module.exports = async ({ github, context, core }) => {
  // All logic here — one file, one language
};
```

Pass GitHub Actions expression values (`${{ }}`) via `env:` on the step, then read them with `process.env` in the script. Never interpolate expressions inside `.js` files.

### gh-aw Compiled Workflows

Source files are `.md` (Markdown with YAML frontmatter). Compiled outputs are `.lock.yml`. Never edit `.lock.yml` directly unless patching values that `gh aw compile` cannot produce (document the reason in the source `.md`).

### Authentication

Use `CLAUDE_CODE_OAUTH_TOKEN` for all Claude Code workflows. Do not create aliases or alternative secret names.

### Version Tags for Actions

Use version tags (`@v7`, `@v4`, `@v1`) for trusted first-party GitHub actions (`actions/*`, `anthropics/*`). SHA pinning is not required for these.
