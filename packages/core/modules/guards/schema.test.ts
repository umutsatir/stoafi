import { describe, expect, it } from "vitest";
import { defaultGuardRules } from "./schema";
import type { GuardContext } from "./schema";
import type { MonthProjection } from "../../kernel/projection";

function baseAfter(overrides: Partial<MonthProjection["byBucket"]["wants"]> = {}): MonthProjection {
  return {
    month: "2026-09",
    income: 10000,
    byBucket: {
      needs: { limit: 5000, committed: 4000 },
      wants: { limit: 3000, committed: 2000, ...overrides },
      savings: { limit: 2000, committed: 2000 },
      investing: { limit: 0, committed: 0 },
    },
    installmentLoad: 0,
    sinkingSetAside: 0,
    freeCash: 2000,
  };
}

function context(overrides: Partial<GuardContext> = {}): GuardContext {
  return {
    after: baseAfter(),
    savingsBalanceAfterDraft: 30000,
    monthlyNeeds: 5000,
    emergencyFundTargetMonths: 6,
    projectedInstallmentLoad: 1000,
    netIncome: 10000,
    installmentCapPct: 0.2,
    ...overrides,
  };
}

function ruleById(id: string) {
  const rule = defaultGuardRules.find((r) => r.id === id);
  if (!rule) throw new Error(`rule not found: ${id}`);
  return rule;
}

describe("emergency fund floor rule", () => {
  const rule = ruleById("emergency-fund-floor");

  it("fails when a draft would drop savings below the target months of needs", () => {
    // target = 5000 * 6 = 30000, balance after = 20000 -> breach
    expect(rule.check(context({ savingsBalanceAfterDraft: 20000 }))).toBe(true);
  });

  it("passes when savings after the draft still meets the target", () => {
    expect(rule.check(context({ savingsBalanceAfterDraft: 30000 }))).toBe(false);
  });
});

describe("installment cap rule", () => {
  const rule = ruleById("installment-cap");

  it("fails when the draft pushes the 12-month load over the cap", () => {
    // cap = 10000 * 0.2 = 2000, projected load 2500 -> breach
    expect(rule.check(context({ projectedInstallmentLoad: 2500 }))).toBe(true);
  });

  it("passes when the load stays within the cap", () => {
    expect(rule.check(context({ projectedInstallmentLoad: 1000 }))).toBe(false);
  });
});

describe("wants limit rule", () => {
  const rule = ruleById("wants-limit");

  it("fails when a draft pushes wants committed over its limit", () => {
    expect(rule.check(context({ after: baseAfter({ committed: 3500 }) }))).toBe(true);
  });

  it("passes when wants committed stays within its limit", () => {
    expect(rule.check(context({ after: baseAfter({ committed: 2000 }) }))).toBe(false);
  });
});
