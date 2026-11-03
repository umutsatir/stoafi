import { describe, expect, it } from "vitest";
import type { Profile } from "../modules/profile/schema";
import { emergencyFirst } from "./emergency-first";

const profile: Profile = {
  incomes: [{ label: "Job", monthly: 5_000_000 }],
  fixedExpenses: [{ label: "Rent", monthly: 1_000_000, bucket: "needs", endMonth: "2026-10" }],
  livingExpenses: 1_000_000,
  savings: 0,
  emergencyFundTargetMonths: 3,
  annualInflationExpectation: 0.3,
};
const plan = { needs: 2_500_000, wants: 1_500_000, savings: 600_000, investing: 400_000 };

describe("emergencyFirst", () => {
  it("moves what the plan would invest into savings while the emergency fund is short", () => {
    expect(emergencyFirst(plan, profile)).toEqual({
      needs: 2_500_000,
      wants: 1_500_000,
      savings: 1_000_000,
      investing: 0,
    });
  });

  it("leaves the plan alone once the emergency fund is at its target, exactly at it included", () => {
    // needs are 2,000,000 a month, times 3 months
    expect(emergencyFirst(plan, { ...profile, savings: 6_000_000 })).toEqual(plan);
    expect(emergencyFirst(plan, { ...profile, savings: 5_999_999 }).investing).toBe(0);
  });

  it("changes nothing when the plan invests nothing, or no target is set", () => {
    const none = { ...plan, savings: 1_000_000, investing: 0 };
    expect(emergencyFirst(none, profile)).toBe(none);
    expect(emergencyFirst(plan, { ...profile, emergencyFundTargetMonths: 0 })).toEqual(plan);
  });

  it("takes the needs of the month it is given, so an ended expense no longer counts", () => {
    // from 2026-11 the rent is over: needs 1,000,000 a month, target 3,000,000
    expect(emergencyFirst(plan, { ...profile, savings: 3_000_000 }, "2026-11")).toEqual(plan);
    expect(emergencyFirst(plan, { ...profile, savings: 3_000_000 }, "2026-10").investing).toBe(0);
  });

  it("keeps the total the same", () => {
    const total = (a: typeof plan) => a.needs + a.wants + a.savings + a.investing;
    expect(total(emergencyFirst(plan, profile))).toBe(total(plan));
  });
});
