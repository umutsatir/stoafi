import { describe, expect, it } from "vitest";
import { emergencyFundMonths, installmentRatio, runway, savingsRate } from "./selectors";
import type { MonthProjection } from "../../kernel/projection";

function projection(overrides: Partial<MonthProjection> = {}): MonthProjection {
  return {
    month: "2026-09",
    income: 10000,
    byBucket: {
      needs: { limit: 5000, committed: 4000 },
      wants: { limit: 3000, committed: 2000 },
      savings: { limit: 2000, committed: 1500 },
      investing: { limit: 0, committed: 500 },
    },
    installmentLoad: 1000,
    sinkingSetAside: 0,
    freeCash: 1000,
    ...overrides,
  };
}

describe("savingsRate", () => {
  it("matches (savings + investing) / income", () => {
    expect(savingsRate(projection())).toBeCloseTo(0.2, 6);
  });

  it("returns 0 without throwing when income is 0", () => {
    expect(() => savingsRate(projection({ income: 0 }))).not.toThrow();
    expect(savingsRate(projection({ income: 0 }))).toBe(0);
  });
});

describe("installmentRatio", () => {
  it("matches installmentLoad / income", () => {
    expect(installmentRatio(projection())).toBeCloseTo(0.1, 6);
  });

  it("returns 0 without throwing when income is 0", () => {
    expect(installmentRatio(projection({ income: 0 }))).toBe(0);
  });
});

describe("emergencyFundMonths", () => {
  it("matches savings / monthly needs", () => {
    expect(emergencyFundMonths(30000, 5000)).toBe(6);
  });

  it("returns 0 without throwing when monthlyNeeds is 0", () => {
    expect(() => emergencyFundMonths(30000, 0)).not.toThrow();
    expect(emergencyFundMonths(30000, 0)).toBe(0);
  });
});

describe("runway", () => {
  it("matches savings / (monthlyNeeds + installmentLoad)", () => {
    expect(runway(30000, 5000, 1000)).toBeCloseTo(5, 6);
  });

  it("returns 0 without throwing when the denominator is 0", () => {
    expect(() => runway(30000, 0, 0)).not.toThrow();
    expect(runway(30000, 0, 0)).toBe(0);
  });
});
