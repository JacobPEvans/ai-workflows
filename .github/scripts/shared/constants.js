// Shared constants for ai-workflows scripts

// Bots whose commits/PRs should be skipped by automation workflows.
// Includes dependency bots (renovate, dependabot) and AI bots (claude).
const automationBots = ['renovate[bot]', 'dependabot[bot]', 'claude[bot]'];

module.exports = { automationBots };
