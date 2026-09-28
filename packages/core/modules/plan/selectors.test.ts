import { describe, expect, it } from "vitest";
import { compareStrategies, currentAllocation } from "./selectors";
import { strategies } from "./strategies-registry";
import type { Profile } from "../profile/schema";

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

describe("currentAllocation", () => {
  it("dispatches to the selected strategy's allocate with parsed params", () => {
    const profile = makeProfile();
    const result = currentAllocation(profile, { strategyId: "fifty-thirty-twenty", params: {} });
    expect(result.needs).toBe(5000);
    expect(result.wants).toBe(3000);
    expect(result.savings).toBe(2000);
  });

  it("throws for an unknown strategy id", () => {
    const profile = makeProfile();
    expect(() =>
      currentAllocation(profile, { strategyId: "does-not-exist", params: {} }),
    ).toThrow();
  });
});

describe("compareStrategies", () => {
  it("returns one allocation result per registered strategy, internally consistent", () => {
    const profile = makeProfile();
    const results = compareStrategies(profile, strategies);

    expect(results).toHaveLength(4);

    for (const { strategyId, allocation } of results) {
      const strategy = strategies[strategyId];
      expect(strategy).toBeDefined();
      const directParams = strategy?.params.parse({});
      const directAllocation = strategy?.allocate(profile, directParams);
      expect(allocation).toEqual(directAllocation);
    }
  });
});
