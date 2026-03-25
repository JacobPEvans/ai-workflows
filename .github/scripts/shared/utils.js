// Shared utility functions for ai-workflows scripts

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Returns a Date object representing 24 hours ago.
 * Use .toISOString() when passing to GitHub API parameters.
 */
function get24hWindowStart() {
  return new Date(Date.now() - ONE_DAY_IN_MS);
}

module.exports = { get24hWindowStart };
