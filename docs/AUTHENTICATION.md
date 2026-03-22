# Authentication & API Providers

All workflows use [`anthropics/claude-code-action@v1`](https://github.com/anthropics/claude-code-action), which accepts an API key via the `anthropic_api_key` input. This repo routes requests through **OpenRouter** by default.

## How Authentication Works

The `claude-code-action` action needs two things to talk to an AI model:

1. **An API key** — passed via the `anthropic_api_key` input (a GitHub Secret)
2. **A base URL** — set via the `ANTHROPIC_BASE_URL` environment variable to point the action at the right provider

When `ANTHROPIC_BASE_URL` points to OpenRouter, the action sends requests to OpenRouter's API, which forwards them to whatever model you specify. The API key authenticates with OpenRouter, not directly with Anthropic.

```
Consumer repo                    OpenRouter                      Anthropic
    |                                |                               |
    |-- anthropic_api_key ---------> |                               |
    |-- ANTHROPIC_BASE_URL --------> |                               |
    |                                |-- forwards to model --------> |
    |                                |<-- response ------------------|
    |<-- response -------------------|                               |
```

## Why Not `CLAUDE_CODE_OAUTH_TOKEN`?

The Claude Code subscription is cheaper per-token, but using a subscription token in **unattended CI** (no human in the loop) **violates the [Claude Code Terms of Service](https://www.anthropic.com/legal/terms)** and risks an account ban.

Key differences:

| | OAuth Token (subscription) | API Key (OpenRouter/Anthropic) |
|---|---|---|
| **Intended use** | Interactive CLI sessions | Programmatic access |
| **Unattended CI** | Prohibited by ToS | Allowed |
| **Cost control** | Per-subscription | Per-key spend limits |
| **Account risk** | Ban possible | None |

API providers like OpenRouter and Chutes.ai are purpose-built for programmatic access — no ToS concerns.

---

## OpenRouter (default)

[OpenRouter](https://openrouter.ai) provides access to Claude and hundreds of other models via a single API key. For Claude-to-Claude, OpenRouter adds a small platform fee on top of Anthropic's base pricing — but the real value is access to cheaper non-Claude models and free-tier options that dramatically reduce CI costs. You can route expensive planning tasks to Claude Opus while running simpler triage through free models, all from one key.

### Setup

1. Create an account at [openrouter.ai](https://openrouter.ai) ([Quick Start](https://openrouter.ai/docs/quickstart))
2. Generate a dedicated API key with a **$/day spend limit** (Keys → Create Key → set Credit Limit)
3. Add the key as `OPENROUTER_API_KEY` in your repo's GitHub Secrets (Settings → Secrets → Actions → New secret)
4. Add a repo variable `OPENROUTER_BASE_URL` set to `https://openrouter.ai/api/v1` (Settings → Variables → Actions → New variable)

### How It's Wired

Every workflow step follows this pattern:

```yaml
- name: Run Claude
  uses: anthropics/claude-code-action@v1
  env:
    ANTHROPIC_BASE_URL: ${{ vars.OPENROUTER_BASE_URL }}
  with:
    anthropic_api_key: ${{ secrets.OPENROUTER_API_KEY }}
    allowed_bots: "github-actions"
    prompt: ${{ steps.prompt.outputs.content }}
    claude_args: >-
      --model ${{ vars.AI_MODEL_REVIEW || vars.AI_MODEL || 'openrouter/free' }}
```

The `env` block redirects the action to OpenRouter. The `anthropic_api_key` authenticates with OpenRouter using your key. The `--model` flag tells OpenRouter which model to use, with a fallback chain (explained in [Model Configuration](#model-configuration) below).

### Cost Controls

OpenRouter offers multiple layers of spend protection:

- **Per-key daily limit** — set during key creation, hard cap per day
- **Per-key total limit** — lifetime cap on a single key
- **Account-level credits** — prepaid balance, workflows stop when depleted
- **Free tier** — `openrouter/free` routes to free models with zero cost (rate-limited to 50 req/day without credits, 1000 req/day with $10+ account balance)

---

## Alternative: Chutes.ai

[Chutes.ai](https://chutes.ai) is a subscription-based provider with preset daily request limits — cost is self-limiting by design. Pay a flat subscription and get a fixed number of requests per day, so there's no risk of runaway spend.

### Setup

1. Create an account at [chutes.ai](https://chutes.ai)
2. Generate an API key from your dashboard
3. Add the key as `CHUTES_API_KEY` in your repo's GitHub Secrets
4. Add a repo variable `CHUTES_BASE_URL` set to the Chutes.ai API endpoint (Settings → Variables → Actions → New variable)

### Workflow Wiring

Same pattern as OpenRouter — just swap the secret and variable names:

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

---

## Alternative: Direct Anthropic API

The `anthropic_api_key` input also accepts a direct [Anthropic API key](https://console.anthropic.com/) (`sk-ant-*`). This is the officially supported method per Anthropic's documentation. No `ANTHROPIC_BASE_URL` is needed — the action defaults to `https://api.anthropic.com`.

```yaml
- name: Run Claude
  uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Trade-offs vs. OpenRouter:**

- Cheapest option for Claude-to-Claude (no platform fee), but locked to Claude models only
- No access to cheaper non-Claude models or free-tier alternatives
- No built-in per-key spend limits (use [Anthropic usage limits](https://console.anthropic.com/settings/limits) instead)
- Simpler setup (one secret, no base URL variable)

---

## Model Configuration

### Fallback Chain

Every workflow uses a 3-tier fallback chain to determine which model to use:

```
inputs.model → vars.AI_MODEL_{CATEGORY} → vars.AI_MODEL → 'openrouter/free'
     |                    |                      |                  |
  Caller override    Category var          Global var       Hardcoded free
  (workflow input)   (per-task tier)       (repo-wide)      (safety net)
```

This means:
- **If you set nothing**: All workflows use `openrouter/free` — zero cost, rate-limited, lower capability
- **If you set `AI_MODEL` only**: All workflows use that model as a baseline
- **If you set category vars**: Each workflow type gets an appropriate model tier
- **If a caller passes `model`**: That overrides everything

### Category Variables

Workflows are grouped by the intelligence level they need:

| Variable | Category | Recommended Value | Why | Workflows |
|----------|----------|-------------------|-----|-----------|
| `AI_MODEL` | Global fallback | `openrouter/auto` | Smart router, picks best model per request | All |
| `AI_MODEL_PLAN` | Deep planning | `anthropic/claude-opus-4` | Architects rich issues that cheaper models execute — needs highest reasoning | issue-resolver |
| `AI_MODEL_REVIEW` | Code review | `anthropic/claude-sonnet-4` | Reads code, uses gh CLI tools, posts structured review feedback | claude-review, final-pr-review |
| `AI_MODEL_CODE` | Code generation | `anthropic/claude-sonnet-4` | Writes and modifies code, creates commits and PRs | ci-fix, code-simplifier, post-merge-tests |
| `AI_MODEL_ISSUES` | Issue management | `anthropic/claude-sonnet-4` | Triages, deduplicates, and manages issues via gh CLI | issue-triage, issue-hygiene, issue-sweeper, issue-linker |
| `AI_MODEL_DOCS` | Documentation | `anthropic/claude-haiku-4` | Lighter review tasks, cost-effective for text analysis | post-merge-docs-review, best-practices, next-steps |
| `AI_MODEL_OPS` | Simple operations | `anthropic/claude-haiku-4` | Label sync, routing — classification tasks with minimal reasoning | label-sync, project-router, repo-orchestrator |

### Quick Setup

**Minimal** (zero cost, limited capability):
```
# Set nothing — all workflows use openrouter/free automatically
```

**Budget-conscious** (one variable, moderate capability):
```
AI_MODEL = openrouter/auto
```

**Production** (full model tiering):
```
AI_MODEL        = openrouter/auto
AI_MODEL_PLAN   = anthropic/claude-opus-4
AI_MODEL_REVIEW = anthropic/claude-sonnet-4
AI_MODEL_CODE   = anthropic/claude-sonnet-4
AI_MODEL_ISSUES = anthropic/claude-sonnet-4
AI_MODEL_DOCS   = anthropic/claude-haiku-4
AI_MODEL_OPS    = anthropic/claude-haiku-4
```

All variables are set as GitHub repo variables (Settings → Variables → Actions), not secrets. Model names are not sensitive.

### OpenRouter Model Names

OpenRouter uses the format `provider/model-name`. Common examples:

| Model | OpenRouter Name |
|-------|----------------|
| Claude Opus 4 | `anthropic/claude-opus-4` |
| Claude Sonnet 4 | `anthropic/claude-sonnet-4` |
| Claude Haiku 4 | `anthropic/claude-haiku-4` |
| Free auto-router | `openrouter/free` |
| Smart auto-router | `openrouter/auto` |

The `openrouter/free` router automatically selects from available free models based on your request. The `openrouter/auto` router picks the best model for each request (costs money but optimizes quality).
