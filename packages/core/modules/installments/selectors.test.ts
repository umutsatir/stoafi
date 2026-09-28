import { describe, expect, it } from "vitest";
import { monthlyRate } from "./selectors";

describe("monthlyRate", () => {
  it("returns 0 when annual inflation is 0", () => {
    expect(monthlyRate(0)).toBe(0);
  });

  it("matches the hand-computed value for 30% annual inflation", () => {
    // r = (1.30)^(1/12) - 1 ≈ 0.02210445
    expect(monthlyRate(0.3)).toBeCloseTo(0.02210445, 6);
  });

  it("does not throw for negative (deflation) input", () => {
    expect(() => monthlyRate(-0.05)).not.toThrow();
    expect(monthlyRate(-0.05)).toBeLessThan(0);
  });
});
