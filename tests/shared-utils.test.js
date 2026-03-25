const { describe, it, expect } = require('bun:test');
const { get24hWindowStart } = require('../.github/scripts/shared/utils');

describe('shared/utils', () => {
  describe('get24hWindowStart', () => {
    it('returns a Date object', () => {
      const result = get24hWindowStart();
      expect(result).toBeInstanceOf(Date);
    });

    it('returns a date approximately 24 hours ago', () => {
      const before = Date.now() - 24 * 60 * 60 * 1000;
      const result = get24hWindowStart();
      const after = Date.now() - 24 * 60 * 60 * 1000;

      expect(result.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.getTime()).toBeLessThanOrEqual(after);
    });

    it('produces a valid ISO string', () => {
      const result = get24hWindowStart().toISOString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});
