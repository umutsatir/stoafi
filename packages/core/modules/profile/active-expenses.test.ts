import { describe, expect, it } from "vitest";
import {
  activeFixedExpenses,
  expenseKind,
  isExpenseActiveInMonth,
  remainingPayments,
} from "./active-expenses";
import type { Profile } from "./schema";

describe("isExpenseActiveInMonth", () => {
  it("is active in every month tested when endMonth is unset", () => {
    expect(isExpenseActiveInMonth({}, "2026-01")).toBe(true);
    expect(isExpenseActiveInMonth({}, "2030-12")).toBe(true);
  });

  it("is active in its endMonth and every earlier month", () => {
    const expense = { endMonth: "2026-06" as const };
    expect(isExpenseActiveInMonth(expense, "2026-01")).toBe(true);
    expect(isExpenseActiveInMonth(expense, "2026-06")).toBe(true);
  });

  it("is inactive in months after endMonth, across a year boundary too", () => {
    const expense = { endMonth: "2026-12" as const };
    expect(isExpenseActiveInMonth(expense, "2026-12")).toBe(true);
    expect(isExpenseActiveInMonth(expense, "2027-01")).toBe(false);
  });
});

describe("activeFixedExpenses", () => {
  const profile: Profile = {
    incomes: [{ label: "Salary", monthly: 10000 }],
    fixedExpenses: [
      { label: "Rent", monthly: 4000, bucket: "needs" },
      { label: "Car loan", monthly: 1500, bucket: "needs", endMonth: "2026-06" },
    ],
    livingExpenses: 0,
    savings: 0,
    emergencyFundTargetMonths: 6,
    annualInflationExpectation: 0.3,
  };

  it("drops an expired expense's contribution after its endMonth", () => {
    const sum = (month: `${number}-${number}`) =>
      activeFixedExpenses(profile, month).reduce((total, e) => total + e.monthly, 0);
    expect(sum("2026-06")).toBe(5500);
    expect(sum("2026-07")).toBe(4000);
  });
});

describe("expenseKind and remainingPayments", () => {
  it("reads a line saved before kinds existed as regular", () => {
    expect(expenseKind({})).toBe("regular");
    expect(expenseKind({ kind: "loan" })).toBe("loan");
  });

  it("counts this month's payment, so the last month leaves one", () => {
    expect(remainingPayments({ endMonth: "2026-12" }, "2026-10")).toBe(3);
    expect(remainingPayments({ endMonth: "2026-10" }, "2026-10")).toBe(1);
  });

  it("has nothing left once ended, and nothing to count for a line that never ends", () => {
    expect(remainingPayments({ endMonth: "2026-09" }, "2026-10")).toBeNull();
    expect(remainingPayments({}, "2026-10")).toBeNull();
  });
});
