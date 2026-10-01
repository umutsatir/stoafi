import { describe, expect, it } from "vitest";
import {
  addEmergencyDeposit,
  editEmergencyDeposit,
  emergencyGap,
  removeEmergencyDeposit,
} from "./emergency-deposits";
import type { Profile } from "./schema";

const profile: Profile = {
  incomes: [],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 1_000_000,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};
const dep = { id: "a", date: "2026-10-03", amount: 250_000 };

describe("emergency fund deposits", () => {
  it("keep the saved balance and the deposit log in step", () => {
    const added = addEmergencyDeposit(profile, dep);
    expect(added).toMatchObject({ ok: true, profile: { savings: 1_250_000, deposits: [dep] } });
    if (!added.ok) return;
    const edited = editEmergencyDeposit(added.profile, { ...dep, amount: 100_000 });
    expect(edited).toMatchObject({ ok: true, profile: { savings: 1_100_000 } });
    const removed = removeEmergencyDeposit(added.profile, "a");
    expect(removed).toMatchObject({ ok: true, profile: { savings: 1_000_000, deposits: [] } });
  });

  it("refuse to take out more than is saved, leaving the profile untouched", () => {
    expect(addEmergencyDeposit(profile, { ...dep, amount: -1_000_001 })).toEqual({
      ok: false,
      reason: "insufficient-balance",
    });
  });

  it("do not touch the rest of the profile", () => {
    const result = addEmergencyDeposit(profile, dep);
    expect(result.ok && result.profile.emergencyFundTargetMonths).toBe(6);
  });
});

describe("emergencyGap", () => {
  it("is how far the savings are below needs times the target months", () => {
    expect(emergencyGap(1_000_000, 500_000, 6)).toBe(2_000_000);
  });

  it("is zero when the target is met or exceeded, and when there is nothing to cover", () => {
    expect(emergencyGap(3_000_000, 500_000, 6)).toBe(0);
    expect(emergencyGap(9_000_000, 500_000, 6)).toBe(0);
    expect(emergencyGap(0, 0, 6)).toBe(0);
  });

  it("rounds a fractional target once, half to even", () => {
    // 3 * 0.5 months of 1,001 = 1,501.5 -> 1,502 (half to even)
    expect(emergencyGap(0, 1_001, 1.5)).toBe(1_502);
  });
});
