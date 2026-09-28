import { describe, expect, it } from "vitest";
import { migrateProfileV1ToV2 } from "./migrations";
import { ProfileSchema } from "./schema";

describe("migrateProfileV1ToV2", () => {
  it("drops the variable flag and sums variable expenses into livingExpenses", () => {
    const migrated = migrateProfileV1ToV2({
      incomes: [{ label: "Salary", monthly: 50000, variable: false }],
      fixedExpenses: [{ label: "Rent", monthly: 20000, bucket: "needs" }],
      avgVariableExpenses: [
        { label: "Groceries", monthly: 8000, bucket: "needs" },
        { label: "Fun", monthly: 3000, bucket: "wants" },
      ],
      savings: 100,
      emergencyFundTargetMonths: 6,
      annualInflationExpectation: 0.3,
    });
    expect(ProfileSchema.parse(migrated)).toEqual({
      incomes: [{ label: "Salary", monthly: 50000 }],
      fixedExpenses: [{ label: "Rent", monthly: 20000, bucket: "needs" }],
      livingExpenses: 11000,
      savings: 100,
      emergencyFundTargetMonths: 6,
      annualInflationExpectation: 0.3,
    });
  });

  it("leaves an already migrated profile untouched", () => {
    const current = {
      incomes: [{ label: "Salary", monthly: 50000 }],
      fixedExpenses: [],
      livingExpenses: 500,
      savings: 0,
      emergencyFundTargetMonths: 6,
      annualInflationExpectation: 0.3,
    };
    expect(migrateProfileV1ToV2(current)).toEqual(current);
  });

  it("returns non-object input unchanged so schema validation reports it", () => {
    expect(migrateProfileV1ToV2(null)).toBeNull();
  });
});
