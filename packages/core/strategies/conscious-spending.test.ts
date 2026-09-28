import { describe, expect, it } from "vitest";
import { allocate, diagnose, paramsSchema } from "./conscious-spending";
import type { Profile } from "../modules/profile/schema";
import type { MonthProjection } from "../kernel/projection";

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    incomes: [{ label: "Salary", monthly: 10000 }],
    fixedExpenses: [],
    livingExpenses: 0,
    savings: 0,
    emergencyFundTargetMonths: 6,
    annualInflationExpectation: 0.3,
    ...overrides,
  };
}

const defaultParams = paramsSchema.parse({});

describe("conscious spending allocate", () => {
  it("splits net income into fixed costs, investments, savings and guilt-free spending", () => {
    const result = allocate(makeProfile(), defaultParams);
    // defaults: fixedCostsPct 0.6, investingPct 0.1, savingsPct 0.1, guiltFreePct 0.2
    expect(result.needs).toBe(6000);
    expect(result.investing).toBe(1000);
    expect(result.savings).toBe(1000);
    expect(result.wants).toBe(2000);

    const total = result.needs + result.wants + result.savings + result.investing;
    expect(Math.abs(total - 10000)).toBeLessThanOrEqual(1);
  });

  it("respects param overrides", () => {
    const params = paramsSchema.parse({
      fixedCostsPct: 0.5,
      investingPct: 0.2,
      savingsPct: 0.1,
      guiltFreePct: 0.2,
    });
    const result = allocate(makeProfile(), params);
    expect(result.needs).toBe(5000);
    expect(result.investing).toBe(2000);
  });
});

describe("conscious spending diagnose", () => {
  function projection(guiltFreeCommitted: number): MonthProjection {
    return {
      month: "2026-09",
      income: 10000,
      byBucket: {
        needs: { limit: 6000, committed: 6000 },
        wants: { limit: 2000, committed: guiltFreeCommitted },
        savings: { limit: 1000, committed: 1000 },
        investing: { limit: 1000, committed: 1000 },
      },
      installmentLoad: 0,
      sinkingSetAside: 0,
      freeCash: 0,
    };
  }

  it("flags overspend in the guilt-free (wants) bucket", () => {
    const insights = diagnose(makeProfile(), [projection(2500)]);
    expect(insights.length).toBeGreaterThan(0);
  });

  it("returns no insight when guilt-free spending is within limit", () => {
    const insights = diagnose(makeProfile(), [projection(2000)]);
    expect(insights).toEqual([]);
  });
});
