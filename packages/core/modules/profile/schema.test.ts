import { describe, expect, it } from "vitest";
import { ProfileSchema } from "./schema";

describe("ProfileSchema", () => {
  it("parses a minimal valid profile", () => {
    const result = ProfileSchema.safeParse({
      incomes: [{ label: "Salary", monthly: 50000 }],
      fixedExpenses: [],
      livingExpenses: 0,
      savings: 0,
      emergencyFundTargetMonths: 6,
      annualInflationExpectation: 0.3,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative savings", () => {
    const result = ProfileSchema.safeParse({
      incomes: [{ label: "Salary", monthly: 50000 }],
      fixedExpenses: [],
      livingExpenses: 0,
      savings: -100,
      emergencyFundTargetMonths: 6,
      annualInflationExpectation: 0.3,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative monthly income", () => {
    const result = ProfileSchema.safeParse({
      incomes: [{ label: "Salary", monthly: -1 }],
      fixedExpenses: [],
      livingExpenses: 0,
      savings: 0,
      emergencyFundTargetMonths: 6,
      annualInflationExpectation: 0.3,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative emergencyFundTargetMonths", () => {
    const result = ProfileSchema.safeParse({
      incomes: [{ label: "Salary", monthly: 50000 }],
      fixedExpenses: [],
      livingExpenses: 0,
      savings: 0,
      emergencyFundTargetMonths: -1,
      annualInflationExpectation: 0.3,
    });
    expect(result.success).toBe(false);
  });
});

describe("ProfileSchema livingExpenses", () => {
  const base = {
    incomes: [{ label: "Salary", monthly: 50000 }],
    fixedExpenses: [],
    savings: 0,
    emergencyFundTargetMonths: 6,
    annualInflationExpectation: 0.3,
  };

  it("parses a non-negative integer livingExpenses", () => {
    expect(ProfileSchema.safeParse({ ...base, livingExpenses: 12345 }).success).toBe(true);
  });

  it("rejects negative or fractional livingExpenses", () => {
    expect(ProfileSchema.safeParse({ ...base, livingExpenses: -1 }).success).toBe(false);
    expect(ProfileSchema.safeParse({ ...base, livingExpenses: 1.5 }).success).toBe(false);
  });

  it("strips the retired avgVariableExpenses list instead of keeping it", () => {
    const result = ProfileSchema.safeParse({ ...base, livingExpenses: 0, avgVariableExpenses: [] });
    expect(result.success).toBe(true);
    expect(result.success && "avgVariableExpenses" in result.data).toBe(false);
  });
});
