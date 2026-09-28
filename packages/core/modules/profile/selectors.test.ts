import { describe, expect, it } from "vitest";
import { dueDayOf, hourlyNetIncome, monthlyNeeds, payDayOf } from "./selectors";
import type { Profile } from "./schema";

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    incomes: [{ label: "Salary", monthly: 32000 }],
    fixedExpenses: [],
    livingExpenses: 0,
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

describe("monthlyNeeds", () => {
  it("returns 0 for an empty profile", () => {
    expect(monthlyNeeds(makeProfile())).toBe(0);
  });

  it("adds needs-bucket fixed expenses and living expenses, ignoring wants", () => {
    const profile = makeProfile({
      fixedExpenses: [
        { label: "Rent", monthly: 10000, bucket: "needs" },
        { label: "Streaming", monthly: 300, bucket: "wants" },
      ],
      livingExpenses: 7000,
    });
    expect(monthlyNeeds(profile)).toBe(17000);
  });
});

describe("payDayOf / dueDayOf", () => {
  it("returns the explicit day when set", () => {
    expect(payDayOf({ payDay: 15 })).toBe(15);
    expect(dueDayOf({ dueDay: 28 })).toBe(28);
  });

  it("defaults to the 1st when omitted", () => {
    expect(payDayOf({})).toBe(1);
    expect(dueDayOf({})).toBe(1);
  });
});

describe("monthlyNeeds for a given month", () => {
  const profile = makeProfile({
    fixedExpenses: [
      { label: "Rent", monthly: 10000, bucket: "needs" },
      { label: "Car loan", monthly: 4000, bucket: "needs", endMonth: "2026-06" },
    ],
    livingExpenses: 1000,
  });

  it("counts an expense through its end month", () => {
    expect(monthlyNeeds(profile, "2026-06")).toBe(15000);
  });

  it("drops an expense after its end month", () => {
    expect(monthlyNeeds(profile, "2026-07")).toBe(11000);
  });

  it("counts every expense when no month is given", () => {
    expect(monthlyNeeds(profile)).toBe(15000);
  });
});
