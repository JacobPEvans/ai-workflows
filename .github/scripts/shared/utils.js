// Shared utility functions for ai-workflows scripts

/**
 * Returns a Date object representing 24 hours ago.
 * Use .toISOString() when passing to GitHub API parameters.
 */
function get24hWindowStart() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

module.exports = { get24hWindowStart };
