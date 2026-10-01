import { describe, expect, it } from "vitest";
import { monthlySavingsAdvice, requiredThisMonth } from "./savings-advice";
import type { SinkingFund } from "./schema";

const fund = (over: Partial<SinkingFund> & { id: string }): SinkingFund => ({
  label: over.id,
  target: 1_200_000,
  dueMonth: "2027-10",
  currentBalance: 0,
  ...over,
});

describe("requiredThisMonth", () => {
  it("is the monthly set-aside for a fund with months to run", () => {
    // 12 months from 2026-10 to 2027-10, 1,200,000 target
    expect(requiredThisMonth(fund({ id: "a" }), "2026-10")).toBe(100_000);
  });

  it("is what is still missing when the fund is due this month or overdue", () => {
    expect(
      requiredThisMonth(fund({ id: "a", dueMonth: "2026-10", currentBalance: 200_000 }), "2026-10"),
    ).toBe(1_000_000);
    expect(
      requiredThisMonth(fund({ id: "a", dueMonth: "2026-08", currentBalance: 200_000 }), "2026-10"),
    ).toBe(1_000_000);
  });

  it("is zero once the fund is funded, including a zero target", () => {
    expect(requiredThisMonth(fund({ id: "a", currentBalance: 1_200_000 }), "2026-10")).toBe(0);
    expect(requiredThisMonth(fund({ id: "a", target: 0 }), "2026-10")).toBe(0);
  });
});

describe("monthlySavingsAdvice", () => {
  const funds = [
    fund({ id: "far", dueMonth: "2027-10" }), // 100,000 a month
    fund({ id: "near", target: 600_000, dueMonth: "2026-12" }), // 2 months: 300,000 a month
  ];

  it("asks for the larger of what the plan suggests and what the pots need, and shows what stays free", () => {
    const advice = monthlySavingsAdvice({
      freeBeforeSaving: 2_000_000,
      planSavings: 1_000_000,
      funds,
      month: "2026-10",
    });
    expect(advice.required).toBe(1_000_000);
    expect(advice.deposited).toBe(0);
    expect(advice.stillToSet).toBe(1_000_000);
    expect(advice.freeAfter).toBe(1_000_000);
  });

  it("uses the pots' need when it is above the plan", () => {
    const advice = monthlySavingsAdvice({
      freeBeforeSaving: 2_000_000,
      planSavings: 100_000,
      funds,
      month: "2026-10",
    });
    expect(advice.required).toBe(400_000);
  });

  it("subtracts what was already put in this month, from pots and from the emergency fund", () => {
    const advice = monthlySavingsAdvice({
      freeBeforeSaving: 2_000_000,
      planSavings: 1_000_000,
      funds: [fund({ id: "far", deposits: [{ id: "x", date: "2026-10-02", amount: 100_000 }] })],
      emergency: { gap: 5_000_000, depositedThisMonth: 300_000 },
      month: "2026-10",
    });
    expect(advice.deposited).toBe(400_000);
    expect(advice.stillToSet).toBe(600_000);
    expect(advice.freeAfter).toBe(1_000_000);
  });

  it("never asks for more once the target is met, and extra saving still reduces what is free", () => {
    const advice = monthlySavingsAdvice({
      freeBeforeSaving: 2_000_000,
      planSavings: 500_000,
      funds: [],
      emergency: { gap: 0, depositedThisMonth: 800_000 },
      month: "2026-10",
    });
    expect(advice.stillToSet).toBe(0);
    expect(advice.freeAfter).toBe(1_200_000);
  });

  it("does not report negative free money", () => {
    const advice = monthlySavingsAdvice({
      freeBeforeSaving: 100_000,
      planSavings: 1_000_000,
      funds: [],
      month: "2026-10",
    });
    expect(advice.freeAfter).toBe(0);
  });

  it("splits the rest across the pots that are due soonest, then the emergency fund, within each need", () => {
    const advice = monthlySavingsAdvice({
      freeBeforeSaving: 5_000_000,
      planSavings: 1_000_000,
      funds,
      emergency: { gap: 10_000_000, depositedThisMonth: 0 },
      month: "2026-10",
    });
    expect(advice.suggestedSplit).toEqual([
      { id: "near", amount: 300_000 },
      { id: "far", amount: 100_000 },
      { id: "emergency", amount: 600_000 },
    ]);
    expect(advice.suggestedSplit.reduce((s, x) => s + x.amount, 0)).toBe(advice.stillToSet);
  });

  it("splits less than the total need in due order and stops when the money runs out", () => {
    const advice = monthlySavingsAdvice({
      freeBeforeSaving: 5_000_000,
      planSavings: 250_000,
      funds: [fund({ id: "far" }), fund({ id: "near", target: 600_000, dueMonth: "2026-12" })],
      month: "2026-10",
    });
    // The pots need 400,000 so that is the target, but each one is capped by its own need.
    expect(advice.required).toBe(400_000);
    expect(advice.suggestedSplit).toEqual([
      { id: "near", amount: 300_000 },
      { id: "far", amount: 100_000 },
    ]);
  });

  it("leaves what no pot can take unassigned instead of inventing a destination", () => {
    const advice = monthlySavingsAdvice({
      freeBeforeSaving: 5_000_000,
      planSavings: 1_000_000,
      funds: [],
      month: "2026-10",
    });
    expect(advice.suggestedSplit).toEqual([{ id: "unassigned", amount: 1_000_000 }]);
  });

  it("handles no pots, no plan and no money", () => {
    expect(
      monthlySavingsAdvice({ freeBeforeSaving: 0, planSavings: 0, funds: [], month: "2026-10" }),
    ).toEqual({ required: 0, deposited: 0, stillToSet: 0, freeAfter: 0, suggestedSplit: [] });
  });
});
