import { describe, expect, it } from "vitest";
import { monthlyRate, pvOfPlan, realSaving } from "./selectors";

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

describe("pvOfPlan", () => {
  it("returns P / (1+r) for a single payment at k=1", () => {
    const pv = pvOfPlan([{ amount: 1200 }], 0.02);
    expect(pv).toBeCloseTo(1200 / 1.02, 6);
  });

  it("returns the sum of payments when r is 0", () => {
    const pv = pvOfPlan([{ amount: 100 }, { amount: 100 }, { amount: 100 }], 0);
    expect(pv).toBeCloseTo(300, 6);
  });

  it("matches a hand-computed PV for 12 equal payments", () => {
    const r = 0.02;
    const payment = 1000;
    let expected = 0;
    for (let k = 1; k <= 12; k++) {
      expected += payment / Math.pow(1 + r, k);
    }
    const payments = Array.from({ length: 12 }, () => ({ amount: payment }));
    expect(pvOfPlan(payments, r)).toBeCloseTo(expected, 6);
  });

  it("returns 0 for zero-length payments", () => {
    expect(pvOfPlan([], 0.02)).toBe(0);
  });

  it("respects a custom firstPaymentOffset", () => {
    const pvAtK1 = pvOfPlan([{ amount: 1000 }], 0.02, 1);
    const pvAtK0 = pvOfPlan([{ amount: 1000 }], 0.02, 0);
    expect(pvAtK0).toBeCloseTo(1000, 6);
    expect(pvAtK1).toBeCloseTo(1000 / 1.02, 6);
  });
});

describe("realSaving", () => {
  it("is positive when PV is cheaper than cash", () => {
    expect(realSaving(1000, 900)).toBeCloseTo(0.1, 6);
  });

  it("is negative when PV is more expensive than cash", () => {
    expect(realSaving(1000, 1100)).toBeCloseTo(-0.1, 6);
  });

  it("is zero when PV equals cash", () => {
    expect(realSaving(1000, 1000)).toBe(0);
  });

  it("returns 0 without throwing when cashPrice is 0", () => {
    expect(() => realSaving(0, 500)).not.toThrow();
    expect(realSaving(0, 500)).toBe(0);
  });
});
