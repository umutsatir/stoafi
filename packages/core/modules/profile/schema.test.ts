import { describe, expect, it } from "vitest";
import { ProfileSchema } from "./schema";

describe("ProfileSchema", () => {
  it("parses a minimal valid profile", () => {
    const result = ProfileSchema.safeParse({
      incomes: [{ label: "Salary", monthly: 50000, variable: false }],
      fixedExpenses: [],
      avgVariableExpenses: [],
      savings: 0,
      emergencyFundTargetMonths: 6,
      annualInflationExpectation: 0.3,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative savings", () => {
    const result = ProfileSchema.safeParse({
      incomes: [{ label: "Salary", monthly: 50000, variable: false }],
      fixedExpenses: [],
      avgVariableExpenses: [],
      savings: -100,
      emergencyFundTargetMonths: 6,
      annualInflationExpectation: 0.3,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative monthly income", () => {
    const result = ProfileSchema.safeParse({
      incomes: [{ label: "Salary", monthly: -1, variable: false }],
      fixedExpenses: [],
      avgVariableExpenses: [],
      savings: 0,
      emergencyFundTargetMonths: 6,
      annualInflationExpectation: 0.3,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative emergencyFundTargetMonths", () => {
    const result = ProfileSchema.safeParse({
      incomes: [{ label: "Salary", monthly: 50000, variable: false }],
      fixedExpenses: [],
      avgVariableExpenses: [],
      savings: 0,
      emergencyFundTargetMonths: -1,
      annualInflationExpectation: 0.3,
    });
    expect(result.success).toBe(false);
  });
});
