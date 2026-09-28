import { describe, expect, it } from "vitest";
import { createRegistry } from "../../kernel/registry";
import { project } from "../../kernel/project";
import { planModule } from "./module";
import { currentAllocation } from "./selectors";
import type { Profile } from "../profile/schema";

describe("planModule", () => {
  it("registers via the kernel registry without error", () => {
    const registry = createRegistry();
    expect(() => registry.register(planModule)).not.toThrow();
  });
});

describe("plan allocation feeding project() bucket limits", () => {
  it("a projection built with plan's currentAllocation shows the correct limit per bucket", () => {
    const profile: Profile = {
      incomes: [{ label: "Salary", monthly: 10000, variable: false }],
      fixedExpenses: [],
      avgVariableExpenses: [],
      savings: 0,
      emergencyFundTargetMonths: 6,
      annualInflationExpectation: 0.3,
    };

    const bucketLimits = currentAllocation(profile, {
      strategyId: "fifty-thirty-twenty",
      params: {},
    });

    const projection = project({ income: 10000 }, [], "2026-09", { bucketLimits });

    expect(projection.byBucket.needs.limit).toBe(5000);
    expect(projection.byBucket.wants.limit).toBe(3000);
    expect(projection.byBucket.savings.limit).toBe(2000);
    expect(projection.byBucket.investing.limit).toBe(0);
  });
});
