import { describe, expect, it } from "vitest";
import { monthlySetAside } from "./selectors";

describe("monthlySetAside", () => {
  it("returns 0 when already fully saved", () => {
    expect(monthlySetAside(10000, 10000, 6)).toBe(0);
  });

  it("returns 0 when saved exceeds target", () => {
    expect(monthlySetAside(10000, 12000, 6)).toBe(0);
  });

  it("matches a hand-computed value for a normal case", () => {
    expect(monthlySetAside(12000, 0, 6)).toBe(2000);
  });

  it("rounds half-to-even at a boundary that doesn't split evenly", () => {
    // (100 - 0) / 3 = 33.333... -> 33 each, half-to-even applies at the remainder
    expect(monthlySetAside(100, 0, 3)).toBe(33);
  });

  it("throws when monthsRemaining is zero or negative", () => {
    expect(() => monthlySetAside(1000, 0, 0)).toThrow();
    expect(() => monthlySetAside(1000, 0, -1)).toThrow();
  });
});
