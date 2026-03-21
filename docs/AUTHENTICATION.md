# Authentication & API Providers

All workflows use [`anthropics/claude-code-action@v1`](https://github.com/anthropics/claude-code-action), which accepts an API key via the `anthropic_api_key` input. This repo routes requests through **OpenRouter** by default.

## Why not `CLAUDE_CODE_OAUTH_TOKEN`?

The Claude Code subscription is cheaper per-token, but using a subscription token in **unattended CI** (no human in the loop) **violates the [Claude Code Terms of Service](https://www.anthropic.com/legal/terms)** and risks an account ban. API providers like OpenRouter and Chutes.ai are purpose-built for programmatic access — no ToS concerns.

## OpenRouter (default)

[OpenRouter](https://openrouter.ai) provides access to Claude and many other models via a single API key. It's cheaper than the direct Anthropic API and designed for automated workloads.

**Setup** ([Quick Start](https://openrouter.ai/docs/quickstart)):

1. Create an account at [openrouter.ai](https://openrouter.ai)
2. Generate a dedicated API key with a **$/day spend limit** (Keys → Create Key → set Credit Limit)
3. Add the key as `OPENROUTER_API_KEY` in your repo's GitHub Secrets
4. Add a repo variable `OPENROUTER_BASE_URL` set to `https://openrouter.ai/api/v1` (Settings → Variables → Actions → New variable)

**How it's wired in workflows:**

```yaml
- name: Run Claude
  uses: anthropics/claude-code-action@v1
  env:
    ANTHROPIC_BASE_URL: ${{ vars.OPENROUTER_BASE_URL }}
  with:
    anthropic_api_key: ${{ secrets.OPENROUTER_API_KEY }}
    allowed_bots: "github-actions"
    prompt: ${{ steps.prompt.outputs.content }}
```

## Alternative: Chutes.ai

[Chutes.ai](https://chutes.ai) is a subscription-based provider with preset daily request limits — cost is self-limiting by design. Pay a flat subscription and get a fixed number of requests per day, so there's no risk of runaway spend.

**Setup:**

1. Create an account at [chutes.ai](https://chutes.ai)
2. Generate an API key from your dashboard
3. Add the key as `CHUTES_API_KEY` in your repo's GitHub Secrets
4. Add a repo variable `CHUTES_BASE_URL` set to the Chutes.ai API endpoint (Settings → Variables → Actions → New variable)

```yaml
- name: Run Claude
  uses: anthropics/claude-code-action@v1
  env:
    ANTHROPIC_BASE_URL: ${{ vars.CHUTES_BASE_URL }}
  with:
    anthropic_api_key: ${{ secrets.CHUTES_API_KEY }}
    allowed_bots: "github-actions"
    prompt: ${{ steps.prompt.outputs.content }}
```

## Alternative: Direct Anthropic API

The `anthropic_api_key` input also accepts a direct [Anthropic API key](https://console.anthropic.com/) (`sk-ant-*`). This is the officially supported method per Anthropic, but it's more expensive and less flexible than routing through OpenRouter.

```yaml
- name: Run Claude
  uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Model Configuration

All workflows use a 3-tier fallback chain: `inputs.model` (caller override) → `vars.AI_MODEL_{CATEGORY}` → `vars.AI_MODEL` → `openrouter/free` (hardcoded safety net).

| Variable | Category | Recommended Value | Workflows |
|----------|----------|-------------------|-----------|
| `AI_MODEL` | Global fallback | `openrouter/auto` | All workflows |
| `AI_MODEL_PLAN` | Deep planning | `anthropic/claude-opus-4` | issue-resolver |
| `AI_MODEL_REVIEW` | Code review | `anthropic/claude-sonnet-4` | claude-review, final-pr-review |
| `AI_MODEL_CODE` | Code generation | `anthropic/claude-sonnet-4` | ci-fix, code-simplifier, post-merge-tests |
| `AI_MODEL_ISSUES` | Issue management | `anthropic/claude-sonnet-4` | issue-triage, issue-hygiene, issue-sweeper, issue-linker |
| `AI_MODEL_DOCS` | Documentation | `anthropic/claude-haiku-4` | post-merge-docs-review, best-practices, next-steps |
| `AI_MODEL_OPS` | Simple operations | `anthropic/claude-haiku-4` | label-sync, project-router, repo-orchestrator |

If no repo variables are set, all workflows automatically fall back to `openrouter/free` — the free-tier model router. This prevents unexpected charges.
