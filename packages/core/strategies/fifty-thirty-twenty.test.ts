import { describe, expect, it } from "vitest";
import { allocate, diagnose, paramsSchema } from "./fifty-thirty-twenty";
import type { Profile } from "../modules/profile/schema";
import type { MonthProjection } from "../kernel/projection";

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    incomes: [{ label: "Salary", monthly: 10000, variable: false }],
    fixedExpenses: [],
    avgVariableExpenses: [],
    savings: 0,
    emergencyFundTargetMonths: 6,
    annualInflationExpectation: 0.3,
    ...overrides,
  };
}

const defaultParams = paramsSchema.parse({});

describe("50/30/20 allocate", () => {
  it("splits net income into an exact 50/30/20 by default", () => {
    const result = allocate(makeProfile(), defaultParams);
    expect(result.needs).toBe(5000);
    expect(result.wants).toBe(3000);
    expect(result.savings).toBe(2000);
    expect(result.investing).toBe(0);

    const total = result.needs + result.wants + result.savings + result.investing;
    expect(Math.abs(total - 10000)).toBeLessThanOrEqual(1);
  });

  it("respects a param override (e.g. 60/20/20)", () => {
    const params = paramsSchema.parse({ needsPct: 0.6, wantsPct: 0.2, savingsPct: 0.2 });
    const result = allocate(makeProfile(), params);
    expect(result.needs).toBe(6000);
    expect(result.wants).toBe(2000);
    expect(result.savings).toBe(2000);
  });
});

describe("50/30/20 diagnose", () => {
  function projection(
    overrides: Partial<MonthProjection["byBucket"]["wants"]> = {},
  ): MonthProjection {
    return {
      month: "2026-09",
      income: 10000,
      byBucket: {
        needs: { limit: 5000, committed: 4000 },
        wants: { limit: 3000, committed: 3000, ...overrides },
        savings: { limit: 2000, committed: 2000 },
        investing: { limit: 0, committed: 0 },
      },
      installmentLoad: 0,
      sinkingSetAside: 0,
      freeCash: 1000,
    };
  }

  it("flags an insight when wants committed exceeds its limit", () => {
    const overBudget = projection({ committed: 3500 });
    const insights = diagnose(makeProfile(), [overBudget]);
    expect(insights.length).toBeGreaterThan(0);
  });

  it("returns no insight when nothing exceeds its limit", () => {
    const withinBudget = projection();
    const insights = diagnose(makeProfile(), [withinBudget]);
    expect(insights).toEqual([]);
  });
});
