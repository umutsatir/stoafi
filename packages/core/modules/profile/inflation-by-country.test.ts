import { describe, expect, it } from "vitest";
import inflationData from "../../data/inflation-by-country.json";
import { suggestedAnnualInflation } from "./inflation-by-country";

describe("inflation-by-country dataset", () => {
  it("every rate is a plausible annual inflation value", () => {
    for (const [code, rate] of Object.entries(inflationData.rates)) {
      expect(rate, `${code} rate out of plausible range`).toBeGreaterThan(-0.5);
      expect(rate, `${code} rate out of plausible range`).toBeLessThan(5);
    }
  });

  it("has at least 30 countries", () => {
    expect(Object.keys(inflationData.rates).length).toBeGreaterThanOrEqual(30);
  });
});

describe("suggestedAnnualInflation", () => {
  it("returns the bundled rate for a known country code", () => {
    expect(suggestedAnnualInflation("TR")).toBe(inflationData.rates.TR);
  });

  it("returns undefined for an unknown country code", () => {
    expect(suggestedAnnualInflation("ZZ")).toBeUndefined();
  });
});
