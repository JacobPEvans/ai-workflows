// Deliberately failing test to trigger ci-doctor investigation.
// This file will be removed after ci-doctor fires once.

describe('ci-doctor-trigger', () => {
  it('intentional failure to trigger CI Failure Doctor on main', () => {
    expect(true).toBe(false);
  });
});
