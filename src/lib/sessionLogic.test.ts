import { shouldEndSession, deriveClarity, canKeepGoing } from "./sessionLogic";

describe("shouldEndSession", () => {
  // Default: reflect mode has 5 exchanges, no bonus
  const MAX = 5;

  it("returns false when under the limit", () => {
    expect(shouldEndSession(3, MAX, 0, false)).toBe(false);
  });

  it("returns true when exchange count equals max", () => {
    expect(shouldEndSession(5, MAX, 0, false)).toBe(true);
  });

  it("returns true when exchange count exceeds max", () => {
    expect(shouldEndSession(6, MAX, 0, false)).toBe(true);
  });

  it("returns true when API signals complete regardless of count", () => {
    expect(shouldEndSession(2, MAX, 0, true)).toBe(true);
  });

  it("returns true when API signals complete even with bonus exchanges remaining", () => {
    expect(shouldEndSession(2, MAX, 3, true)).toBe(true);
  });

  it("returns false when under max + bonus", () => {
    expect(shouldEndSession(6, MAX, 3, false)).toBe(false);
  });

  it("returns true when exchange count equals max + bonus", () => {
    expect(shouldEndSession(8, MAX, 3, false)).toBe(true);
  });

  it("returns true when exchange count exceeds max + bonus", () => {
    expect(shouldEndSession(9, MAX, 3, false)).toBe(true);
  });

  it("handles multiple bonus rounds (6 bonus = 2 keep-goings)", () => {
    expect(shouldEndSession(10, MAX, 6, false)).toBe(false);
    expect(shouldEndSession(11, MAX, 6, false)).toBe(true);
  });

  it("handles ground mode (3 exchanges)", () => {
    expect(shouldEndSession(2, 3, 0, false)).toBe(false);
    expect(shouldEndSession(3, 3, 0, false)).toBe(true);
  });

  it("handles prepare mode (7 exchanges)", () => {
    expect(shouldEndSession(6, 7, 0, false)).toBe(false);
    expect(shouldEndSession(7, 7, 0, false)).toBe(true);
  });

  it("handles zero bonus (no keep-going used)", () => {
    expect(shouldEndSession(5, MAX, 0, false)).toBe(true);
  });

  it("handles edge: 0 exchanges, API complete", () => {
    expect(shouldEndSession(0, MAX, 0, true)).toBe(true);
  });

  it("handles edge: 0 exchanges, not complete", () => {
    expect(shouldEndSession(0, MAX, 0, false)).toBe(false);
  });
});

describe("deriveClarity", () => {
  it("returns 'yes' for 'yes'", () => {
    expect(deriveClarity("yes")).toBe("yes");
  });

  it("returns 'yes' for 'a-little'", () => {
    expect(deriveClarity("a-little")).toBe("yes");
  });

  it("returns 'no' for 'not-yet'", () => {
    expect(deriveClarity("not-yet")).toBe("no");
  });

  it("returns 'skip' for null", () => {
    expect(deriveClarity(null)).toBe("skip");
  });
});

describe("canKeepGoing", () => {
  it("returns true for 'not-yet'", () => {
    expect(canKeepGoing("not-yet")).toBe(true);
  });

  it("returns false for 'yes'", () => {
    expect(canKeepGoing("yes")).toBe(false);
  });

  it("returns false for 'a-little'", () => {
    expect(canKeepGoing("a-little")).toBe(false);
  });

  it("returns false for null", () => {
    expect(canKeepGoing(null)).toBe(false);
  });
});
