// Shared constants for ai-workflows scripts

// Bots whose commits/PRs should be skipped by automation workflows.
// Includes dependency bots (renovate, dependabot) and AI bots (claude).
const automationBots = ['renovate[bot]', 'dependabot[bot]', 'claude[bot]'];

// Daily ceiling for bot-created PRs (prevents automation loops).
// Configurable per-workflow via PR_DAILY_CEILING env var in check-pr-ceiling.js.
const PR_DAILY_CEILING = 5;

// Daily ceiling for bot-created issues (prevents automation loops).
const ISSUE_DAILY_CEILING = 5;

module.exports = { automationBots, PR_DAILY_CEILING, ISSUE_DAILY_CEILING };
