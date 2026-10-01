import { describe, expect, it } from "vitest";
import type { MonthProjection } from "../kernel/projection";
import type { Profile } from "../modules/profile/schema";
import { strategies } from "../modules/plan/strategies-registry";

const profile: Profile = {
  incomes: [{ label: "Job", monthly: 1_000_000 }],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

function projection(month: `${number}-${number}`, wantsCommitted: number): MonthProjection {
  return {
    month,
    income: 1_000_000,
    byBucket: {
      needs: { limit: 500_000, committed: 0 },
      wants: { limit: 300_000, committed: wantsCommitted },
      savings: { limit: 200_000, committed: 0 },
      investing: { limit: 0, committed: 0 },
    },
    installmentLoad: 0,
    sinkingSetAside: 0,
    freeCash: 1_000_000,
  };
}

describe("every strategy's insights name the month they are about", () => {
  const projections = [projection("2026-10", 400_000), projection("2026-11", 400_000)];

  for (const id of Object.keys(strategies)) {
    it(`${id}: each insight carries its month`, () => {
      const insights = strategies[id]?.diagnose(profile, projections) ?? [];
      expect(insights.length).toBeGreaterThan(0);
      for (const insight of insights) {
        expect(["2026-10", "2026-11"]).toContain(insight.month);
      }
      expect(new Set(insights.map((i) => i.month))).toEqual(new Set(["2026-10", "2026-11"]));
    });
  }

  it("a month under the limit produces no wants insight for 50/30/20", () => {
    const insights =
      strategies["fifty-thirty-twenty"]?.diagnose(profile, [projection("2026-10", 100_000)]) ?? [];
    expect(insights).toEqual([]);
  });
});
