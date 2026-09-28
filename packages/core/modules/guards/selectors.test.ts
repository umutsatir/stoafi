import { describe, expect, it } from "vitest";
import { evaluateGuards } from "./selectors";
import { defaultGuardRules } from "./schema";
import type { GuardContext } from "./schema";
import type { MonthProjection } from "../../kernel/projection";

function projection(wantsCommitted: number): MonthProjection {
  return {
    month: "2026-09",
    income: 10000,
    byBucket: {
      needs: { limit: 5000, committed: 4000 },
      wants: { limit: 3000, committed: wantsCommitted },
      savings: { limit: 2000, committed: 2000 },
      investing: { limit: 0, committed: 0 },
    },
    installmentLoad: 0,
    sinkingSetAside: 0,
    freeCash: 2000,
  };
}

describe("evaluateGuards", () => {
  it("returns a breach for each of 2 rules that fail, with correct rule ids", () => {
    const ctx: GuardContext = {
      after: projection(3500), // breaches wants-limit
      savingsBalanceAfterDraft: 10000, // below 5000*6=30000 -> breaches emergency-fund-floor
      monthlyNeeds: 5000,
      emergencyFundTargetMonths: 6,
      projectedInstallmentLoad: 1000, // within cap (10000*0.2=2000) -> passes
      netIncome: 10000,
      installmentCapPct: 0.2,
    };

    const breaches = evaluateGuards(defaultGuardRules, ctx);

    expect(breaches).toHaveLength(2);
    expect(breaches.map((b) => b.ruleId).sort()).toEqual(
      ["emergency-fund-floor", "wants-limit"].sort(),
    );
  });

  it("returns an empty array for a clean draft", () => {
    const ctx: GuardContext = {
      after: projection(2000),
      savingsBalanceAfterDraft: 30000,
      monthlyNeeds: 5000,
      emergencyFundTargetMonths: 6,
      projectedInstallmentLoad: 1000,
      netIncome: 10000,
      installmentCapPct: 0.2,
    };

    expect(evaluateGuards(defaultGuardRules, ctx)).toEqual([]);
  });
});
