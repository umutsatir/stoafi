import { describe, expect, it } from "vitest";
import type { Holding, Profile, SinkingFund } from "@stoafi/core";
import { snapshotFromState } from "./snapshot-from-state";

const profile: Profile = {
  incomes: [{ label: "Job", monthly: 6_000_000 }],
  fixedExpenses: [{ label: "Rent", monthly: 1_800_000, bucket: "needs" }],
  livingExpenses: 1_200_000,
  savings: 9_000_000,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};
const gold: Holding = {
  id: "g",
  label: "Gold",
  typeId: "gold",
  currentPrice: 300_000,
  trades: [{ id: "t", date: "2026-01-01", side: "buy", quantity: 2, unitPrice: 200_000 }],
};
const pot: SinkingFund = {
  id: "p",
  label: "Car",
  target: 600_000,
  dueMonth: "2027-04",
  currentBalance: 150_000,
};

describe("snapshotFromState", () => {
  const base = {
    profile,
    planState: { strategyId: "fifty-thirty-twenty", params: {} },
    queueItems: [],
    sinkingFunds: [pot],
    holdings: [gold],
    installmentCapPct: 0.2,
    today: "2026-10-15",
  };

  it("records the month with its income, what is left and its wealth", () => {
    const snapshot = snapshotFromState(base);
    expect(snapshot).toMatchObject({ id: "2026-10", month: "2026-10", income: 6_000_000 });
    // 60,000 - 18,000 - 12,000 - the pot's set-aside from next month on (not this one)
    expect(snapshot.left).toBe(3_000_000);
    expect(snapshot.wealth).toBe(9_000_000 + 150_000 + 600_000);
    expect(snapshot.emergencyMonths).toBe(3);
  });

  it("is the same for the same state and changes when the data does", () => {
    expect(snapshotFromState(base)).toEqual(snapshotFromState(base));
    expect(snapshotFromState({ ...base, holdings: [] }).wealth).toBe(9_000_000 + 150_000);
  });

  it("works without a plan", () => {
    expect(snapshotFromState({ ...base, planState: null }).month).toBe("2026-10");
  });
});
