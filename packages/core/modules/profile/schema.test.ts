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

describe("ProfileSchema pay day, due day and end month", () => {
  const base = {
    incomes: [{ label: "Salary", monthly: 50000 }],
    fixedExpenses: [{ label: "Rent", monthly: 20000, bucket: "needs" }],
    livingExpenses: 0,
    savings: 0,
    emergencyFundTargetMonths: 6,
    annualInflationExpectation: 0.3,
  };

  it("still parses incomes and expenses that omit the new fields", () => {
    expect(ProfileSchema.safeParse(base).success).toBe(true);
  });

  it("parses a pay day, a due day and an end month", () => {
    const result = ProfileSchema.safeParse({
      ...base,
      incomes: [{ label: "Salary", monthly: 50000, payDay: 15 }],
      fixedExpenses: [
        { label: "Car loan", monthly: 20000, bucket: "needs", dueDay: 5, endMonth: "2027-06" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects days outside 1 to 31", () => {
    const income = (payDay: number) => ({
      ...base,
      incomes: [{ label: "Salary", monthly: 1, payDay }],
    });
    const expense = (dueDay: number) => ({
      ...base,
      fixedExpenses: [{ label: "Rent", monthly: 1, bucket: "needs", dueDay }],
    });
    expect(ProfileSchema.safeParse(income(0)).success).toBe(false);
    expect(ProfileSchema.safeParse(income(32)).success).toBe(false);
    expect(ProfileSchema.safeParse(expense(0)).success).toBe(false);
    expect(ProfileSchema.safeParse(expense(32)).success).toBe(false);
    expect(ProfileSchema.safeParse(expense(1.5)).success).toBe(false);
  });

  it("rejects a malformed end month", () => {
    const result = ProfileSchema.safeParse({
      ...base,
      fixedExpenses: [{ label: "Rent", monthly: 1, bucket: "needs", endMonth: "2027-13" }],
    });
    expect(result.success).toBe(false);
  });
});
