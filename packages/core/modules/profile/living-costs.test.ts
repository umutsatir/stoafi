import { describe, expect, it } from "vitest";
import { livingCostCheck } from "./living-costs";

const base = { living: 1_500_000, income: 5_000_000, annualInflation: 0.4 };

describe("livingCostCheck bands", () => {
  it("is comfortable at or under 30% of income, typical to 45%, high to 60%, very high above", () => {
    const band = (living: number) => livingCostCheck({ ...base, living }).band;
    expect(band(1_500_000)).toBe("comfortable");
    expect(band(1_500_001)).toBe("typical");
    expect(band(2_250_000)).toBe("typical");
    expect(band(2_250_001)).toBe("high");
    expect(band(3_000_000)).toBe("high");
    expect(band(3_000_001)).toBe("veryHigh");
  });

  it("gives the share, and no verdict when there is no income to compare with", () => {
    expect(livingCostCheck(base).share).toBeCloseTo(0.3);
    const none = livingCostCheck({ ...base, income: 0 });
    expect(none.share).toBeNull();
    expect(none.band).toBeNull();
  });

  it("handles zero living costs", () => {
    const check = livingCostCheck({ ...base, living: 0 });
    expect(check.band).toBe("comfortable");
    expect(check.nextYear).toBe(0);
    expect(check.increase).toBe(0);
  });
});

describe("livingCostCheck over a year", () => {
  it("projects the same costs a year on at the expected inflation, rounded once", () => {
    const check = livingCostCheck({ ...base, living: 1_000_001, annualInflation: 0.375 });
    expect(check.nextYear).toBe(1_375_001); // 1,375,001.375
    expect(check.increase).toBe(375_000);
  });

  it("says nothing about the user's own rise when they did not give last year's figure", () => {
    const check = livingCostCheck(base);
    expect(check.ownRise).toBeNull();
    expect(check.versusExpected).toBeNull();
  });

  it("compares the user's own rise with the expected one, with a little tolerance", () => {
    const versus = (yearAgo: number) =>
      livingCostCheck({ ...base, living: 1_500_000, yearAgo }).versusExpected;
    // expected 40%
    expect(versus(1_000_000)).toBe("above"); // +50%
    expect(versus(1_070_000)).toBe("near"); // about +40%
    expect(versus(1_500_000)).toBe("below"); // 0%
  });

  it("reports the rise as a fraction", () => {
    expect(livingCostCheck({ ...base, living: 1_500_000, yearAgo: 1_000_000 }).ownRise).toBeCloseTo(
      0.5,
    );
  });

  it("ignores a year-ago figure of zero", () => {
    expect(livingCostCheck({ ...base, yearAgo: 0 }).ownRise).toBeNull();
  });
});
