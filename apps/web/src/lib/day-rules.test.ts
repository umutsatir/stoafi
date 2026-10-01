import { describe, expect, it } from "vitest";
import type { Card, Profile } from "@stoafi/core";
import { dayRulesFor } from "./day-rules";

const profile: Profile = {
  incomes: [
    { label: "Job", monthly: 100, payDay: 15 },
    { label: "Side", monthly: 50 },
  ],
  fixedExpenses: [{ label: "Loan", monthly: 20, bucket: "needs", dueDay: 5, endMonth: "2027-01" }],
  livingExpenses: 0,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};
const card: Card = { id: "c", label: "Bonus", statementDay: 1, dueDay: 25 };

describe("dayRulesFor", () => {
  it("turns pay days, bills and card due dates into rules, reading a missing day as the 1st", () => {
    expect(dayRulesFor(profile, [card])).toEqual([
      { id: "income-0", label: "Job", kind: "income", day: 15, amount: 100 },
      { id: "income-1", label: "Side", kind: "income", day: 1, amount: 50 },
      { id: "expense-0", label: "Loan", kind: "expense", day: 5, amount: 20, endMonth: "2027-01" },
      { id: "card-c", label: "Bonus", kind: "card", day: 25 },
    ]);
  });

  it("is empty with nothing set", () => {
    expect(dayRulesFor({ ...profile, incomes: [], fixedExpenses: [] }, [])).toEqual([]);
  });
});
