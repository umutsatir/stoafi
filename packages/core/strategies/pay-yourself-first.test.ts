import { describe, expect, it } from "vitest";
import { allocate, diagnose, paramsSchema } from "./pay-yourself-first";
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

describe("pay yourself first allocate", () => {
  it("reserves savings first, then splits the remainder by params", () => {
    const result = allocate(makeProfile(), defaultParams);
    // default savingsFirstPct 0.2, remainder split 60/40 needs/wants of the rest
    expect(result.savings).toBe(2000);
    const remainder = 10000 - result.savings;
    expect(result.needs + result.wants).toBe(remainder);
  });

  it("respects a param override for the savings-first percentage", () => {
    const params = paramsSchema.parse({ savingsFirstPct: 0.3 });
    const result = allocate(makeProfile(), params);
    expect(result.savings).toBe(3000);
  });
});

describe("pay yourself first diagnose", () => {
  function projection(committedSavings: number): MonthProjection {
    return {
      month: "2026-09",
      income: 10000,
      byBucket: {
        needs: { limit: 4800, committed: 4800 },
        wants: { limit: 3200, committed: 3200 },
        savings: { limit: 2000, committed: committedSavings },
        investing: { limit: 0, committed: 0 },
      },
      installmentLoad: 0,
      sinkingSetAside: 0,
      freeCash: 0,
    };
  }

  it("flags a shortfall when committed savings is below the allocated amount", () => {
    const insights = diagnose(makeProfile(), [projection(1000)]);
    expect(insights.length).toBeGreaterThan(0);
  });

  it("returns no insight when savings target is met", () => {
    const insights = diagnose(makeProfile(), [projection(2000)]);
    expect(insights).toEqual([]);
  });
});
