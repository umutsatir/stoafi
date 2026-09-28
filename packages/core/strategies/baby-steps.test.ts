import { describe, expect, it } from "vitest";
import { allocate, diagnose, paramsSchema } from "./baby-steps";
import type { Profile } from "../modules/profile/schema";
import type { MonthProjection } from "../kernel/projection";

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    incomes: [{ label: "Salary", monthly: 100_000, variable: false }],
    fixedExpenses: [{ label: "Rent", monthly: 40_000, bucket: "needs" }],
    avgVariableExpenses: [],
    savings: 0,
    emergencyFundTargetMonths: 6,
    annualInflationExpectation: 0.3,
    ...overrides,
  };
}

const defaultParams = paramsSchema.parse({});
// fullTarget = 40_000 * 6 = 240_000, well above the default starterFundTarget (100_000).
const fullTarget = 40_000 * 6;

function projection(overrides: Partial<MonthProjection> = {}): MonthProjection {
  return {
    month: "2026-09",
    income: 100_000,
    byBucket: {
      needs: { limit: 40_000, committed: 40_000 },
      wants: { limit: 0, committed: 0 },
      savings: { limit: 0, committed: 0 },
      investing: { limit: 0, committed: 0 },
    },
    installmentLoad: 0,
    sinkingSetAside: 0,
    freeCash: 60_000,
    ...overrides,
  };
}

describe("baby steps allocate", () => {
  it("step 1: below the starter fund threshold, allocates ~100% of the remainder to savings", () => {
    const profile = makeProfile({ savings: 0 });
    const result = allocate(profile, defaultParams);
    expect(result.needs).toBe(40_000);
    expect(result.savings).toBe(60_000);
    expect(result.wants).toBe(0);
    expect(result.investing).toBe(0);
  });

  it("step 3+: above the starter fund but below the full emergency fund, uses the normal split", () => {
    const profile = makeProfile({ savings: defaultParams.starterFundTarget + 1 });
    const result = allocate(profile, defaultParams);
    expect(result.savings).toBeGreaterThan(0);
    expect(result.wants).toBeGreaterThan(0);
  });

  it("once the full emergency fund is met, shifts savings share into investing", () => {
    const fullFundProfile = makeProfile({ savings: fullTarget + 1 });
    const result = allocate(fullFundProfile, defaultParams);
    expect(result.investing).toBeGreaterThan(0);
  });
});

describe("baby steps diagnose", () => {
  it("reports step 1 when savings is below the starter fund", () => {
    const profile = makeProfile({ savings: 0 });
    const insights = diagnose(profile, [projection()]);
    expect(insights.some((i) => i.id === "baby-steps:step-1")).toBe(true);
  });

  it("reports step 2 (debt payoff) when past step 1 but installment load is nonzero", () => {
    const profile = makeProfile({ savings: defaultParams.starterFundTarget + 1 });
    const insights = diagnose(profile, [projection({ installmentLoad: 500 })]);
    expect(insights.some((i) => i.id === "baby-steps:step-2")).toBe(true);
  });

  it("reports step 3 when past the starter fund, no debt, but below the full emergency fund", () => {
    const profile = makeProfile({ savings: defaultParams.starterFundTarget + 1 });
    const insights = diagnose(profile, [projection({ installmentLoad: 0 })]);
    expect(insights.some((i) => i.id === "baby-steps:step-3")).toBe(true);
  });

  it("reports step 4 once the full emergency fund is met", () => {
    const profile = makeProfile({ savings: fullTarget + 1 });
    const insights = diagnose(profile, [projection({ installmentLoad: 0 })]);
    expect(insights.some((i) => i.id === "baby-steps:step-4")).toBe(true);
  });
});
