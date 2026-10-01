import { describe, expect, it } from "vitest";
import type { Profile, QueueItem } from "@stoafi/core";
import { remainingByCard } from "./card-debt";

const profile: Profile = {
  incomes: [],
  fixedExpenses: [
    {
      label: "Phone",
      monthly: 100_000,
      bucket: "needs",
      kind: "installment",
      cardId: "a",
      endMonth: "2026-12",
    },
  ],
  livingExpenses: 0,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

const purchase: QueueItem = {
  id: "fridge",
  name: "Fridge",
  price: 600_000,
  urgency: 2,
  importance: 2,
  isNeed: true,
  expectedUses: 1,
  addedDate: "2026-01-01",
  priceUpdatedDate: "2026-01-01",
  order: 0,
  installmentPurchase: {
    offer: { months: 3, payments: [200_000, 200_000, 200_000] },
    firstMonth: "2026-10",
    cardId: "a",
  },
};

describe("remainingByCard", () => {
  it("adds queue purchases and installment expenses on the same card", () => {
    expect(remainingByCard([purchase], profile, "2026-10")).toEqual({ a: 600_000 + 300_000 });
  });

  it("works without a profile, and without any purchases", () => {
    expect(remainingByCard([purchase], null, "2026-10")).toEqual({ a: 600_000 });
    expect(remainingByCard([], profile, "2026-10")).toEqual({ a: 300_000 });
    expect(remainingByCard([], null, "2026-10")).toEqual({});
  });
});
