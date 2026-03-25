const { describe, it, expect, spyOn } = require('bun:test');
const { get24hWindowStart } = require('../.github/scripts/shared/utils.js');

describe('shared/utils', () => {
  describe('get24hWindowStart', () => {
    it('returns a Date object', () => {
      const result = get24hWindowStart();
      expect(result).toBeInstanceOf(Date);
    });

    it('returns a date exactly 24 hours ago', () => {
      const now = 1672574400000;
      const spy = spyOn(Date, 'now').mockImplementation(() => now);

      const result = get24hWindowStart();
      const expected = now - 24 * 60 * 60 * 1000;

      expect(result.getTime()).toBe(expected);

      spy.mockRestore();
    });

    it('produces a valid ISO string', () => {
      const result = get24hWindowStart().toISOString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});
