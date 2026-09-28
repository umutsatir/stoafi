import { describe, expect, it } from "vitest";
import type { Profile } from "@stoafi/core";
import { mergeProfile } from "./profile-merge";

const saved: Profile = {
  incomes: [{ label: "Job", monthly: 100_000 }],
  fixedExpenses: [{ label: "Rent", monthly: 30_000, bucket: "needs" }],
  livingExpenses: 20_000,
  savings: 500_000,
  emergencyFundTargetMonths: 4,
  annualInflationExpectation: 0.5,
};

describe("mergeProfile", () => {
  it("keeps the other screen's fields when one screen saves", () => {
    const merged = mergeProfile(saved, { savings: 900_000 });
    expect(merged).toEqual({ ...saved, savings: 900_000 });
  });

  it("starts from sensible defaults when nothing is saved yet", () => {
    const merged = mergeProfile(null, { livingExpenses: 10_000 });
    expect(merged).toEqual({
      incomes: [],
      fixedExpenses: [],
      livingExpenses: 10_000,
      savings: 0,
      emergencyFundTargetMonths: 6,
      annualInflationExpectation: 0.3,
    });
  });

  it("does not mutate the saved profile", () => {
    const copy = structuredClone(saved);
    mergeProfile(saved, { incomes: [] });
    expect(saved).toEqual(copy);
  });
});
