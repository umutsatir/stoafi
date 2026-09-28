import { describe, expect, it } from "vitest";
import { hourlyNetIncome } from "./selectors";
import type { Profile } from "./schema";

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    incomes: [{ label: "Salary", monthly: 32000, variable: false }],
    fixedExpenses: [],
    avgVariableExpenses: [],
    savings: 0,
    emergencyFundTargetMonths: 6,
    annualInflationExpectation: 0.3,
    ...overrides,
  };
}

describe("hourlyNetIncome", () => {
  it("returns the explicit hourlyNetIncome when present", () => {
    const profile = makeProfile({ hourlyNetIncome: 500 });
    expect(hourlyNetIncome(profile)).toBe(500);
  });

  it("derives from net income / 160 by default", () => {
    const profile = makeProfile();
    expect(hourlyNetIncome(profile)).toBe(200);
  });

  it("respects a custom hoursPerMonth", () => {
    const profile = makeProfile();
    expect(hourlyNetIncome(profile, 100)).toBe(320);
  });

  it("returns 0 for zero income instead of NaN or Infinity", () => {
    const profile = makeProfile({ incomes: [] });
    expect(hourlyNetIncome(profile)).toBe(0);
  });
});
