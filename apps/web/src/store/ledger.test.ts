import { describe, expect, it } from "vitest";
import type { Profile, QueueItem, SinkingFund } from "@stoafi/core";
import { buildLedger } from "./ledger";

const profile: Profile = {
  incomes: [{ label: "Job", monthly: 1_000_000 }],
  fixedExpenses: [{ label: "Rent", monthly: 200_000, bucket: "needs" }],
  livingExpenses: 300_000,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

const bought: QueueItem = {
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
  },
};

describe("buildLedger", () => {
  it("combines recurring costs from the profile with bought installments", () => {
    const modules = buildLedger(profile, [bought], "2026-10").map((c) => c.source.module);
    expect(modules).toContain("profile");
    expect(modules).toContain("installments");
  });

  it("has only installments before a profile exists", () => {
    const ledger = buildLedger(null, [bought], "2026-10");
    expect(ledger.map((c) => c.source.module)).toEqual(["installments"]);
  });

  it("is empty with nothing to count", () => {
    expect(buildLedger(null, [], "2026-10")).toEqual([]);
  });

  it("starts recurring costs at the given month", () => {
    const rent = buildLedger(profile, [], "2026-10").find((c) => c.source.refId === "fixed-0");
    expect(rent?.payments[0]?.month).toBe("2026-10");
  });

  it("adds sinking-fund set-asides that still have months to run", () => {
    const funds: SinkingFund[] = [
      { id: "ahead", label: "Insurance", target: 600_000, dueMonth: "2027-04", currentBalance: 0 },
      { id: "late", label: "Old", target: 100_000, dueMonth: "2026-05", currentBalance: 0 },
    ];
    const ledger = buildLedger(profile, [], "2026-10", funds);
    const sinking = ledger.filter((c) => c.source.module === "sinking-funds");
    expect(sinking.map((c) => c.source.refId)).toEqual(["ahead"]);
  });
});
