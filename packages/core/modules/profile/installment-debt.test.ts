import { describe, expect, it } from "vitest";
import { installmentDebtByCard } from "./installment-debt";
import type { Profile } from "./schema";

const base: Profile = {
  incomes: [],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

describe("installmentDebtByCard", () => {
  it("adds up the payments still to make on each card, counting this month", () => {
    const profile: Profile = {
      ...base,
      fixedExpenses: [
        {
          label: "Phone",
          monthly: 100_000,
          bucket: "needs",
          kind: "installment",
          cardId: "a",
          endMonth: "2026-12",
        },
        {
          label: "TV",
          monthly: 50_000,
          bucket: "wants",
          kind: "installment",
          cardId: "a",
          endMonth: "2026-10",
        },
        {
          label: "Fridge",
          monthly: 200_000,
          bucket: "needs",
          kind: "installment",
          cardId: "b",
          endMonth: "2027-01",
        },
      ],
    };
    expect(installmentDebtByCard(profile, "2026-10")).toEqual({
      a: 3 * 100_000 + 50_000,
      b: 4 * 200_000,
    });
  });

  it("leaves out lines with no card, loans, bills and finished installments", () => {
    const profile: Profile = {
      ...base,
      fixedExpenses: [
        {
          label: "No card",
          monthly: 100_000,
          bucket: "needs",
          kind: "installment",
          endMonth: "2026-12",
        },
        {
          label: "Loan",
          monthly: 100_000,
          bucket: "needs",
          kind: "loan",
          cardId: "a",
          endMonth: "2026-12",
        },
        { label: "Rent", monthly: 100_000, bucket: "needs", cardId: "a" },
        {
          label: "Done",
          monthly: 100_000,
          bucket: "needs",
          kind: "installment",
          cardId: "a",
          endMonth: "2026-08",
        },
      ],
    };
    expect(installmentDebtByCard(profile, "2026-10")).toEqual({});
  });
});
