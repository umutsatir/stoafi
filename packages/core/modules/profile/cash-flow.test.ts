import { describe, expect, it } from "vitest";
import type { Commitment } from "../../kernel/commitment";
import type { Month } from "../../kernel/month";
import { cashFlowSeries } from "./cash-flow";
import type { Profile } from "./schema";

const profile: Profile = {
  incomes: [{ label: "Job", monthly: 1_000_000 }],
  fixedExpenses: [
    { label: "Rent", monthly: 200_000, bucket: "needs" },
    { label: "Car loan", monthly: 100_000, bucket: "needs", endMonth: "2026-11" },
  ],
  livingExpenses: 300_000,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

const installment: Commitment = {
  id: "installment-fridge",
  source: { module: "installments", refId: "fridge" },
  bucket: "needs",
  payments: [
    { month: "2026-10", amount: 100_000 },
    { month: "2026-11", amount: 100_000 },
  ],
  status: "active",
};

const months: Month[] = ["2026-10", "2026-11", "2026-12"];

describe("cashFlowSeries", () => {
  it("returns one point per month, in order", () => {
    const series = cashFlowSeries(profile, [], months);
    expect(series.map((p) => p.month)).toEqual(months);
  });

  it("subtracts recurring expenses, living costs and installments from income", () => {
    const [first] = cashFlowSeries(profile, [installment], months);
    expect(first).toEqual({
      month: "2026-10",
      income: 1_000_000,
      obligations: 300_000,
      living: 300_000,
      installments: 100_000,
      setAside: 0,
      left: 300_000,
    });
  });

  it("stops counting an expense after its end month and installments after their last payment", () => {
    const series = cashFlowSeries(profile, [installment], months);
    expect(series.map((p) => p.obligations)).toEqual([300_000, 300_000, 200_000]);
    expect(series.map((p) => p.installments)).toEqual([100_000, 100_000, 0]);
    expect(series.map((p) => p.left)).toEqual([300_000, 300_000, 500_000]);
  });

  it("goes negative when costs exceed income, so the chart can show it", () => {
    const tight = { ...profile, livingExpenses: 900_000 };
    const [first] = cashFlowSeries(tight, [], months);
    expect(first?.left).toBe(-200_000);
  });

  it("ignores draft commitments", () => {
    const draft: Commitment = { ...installment, status: "draft" };
    const [first] = cashFlowSeries(profile, [draft], months);
    expect(first?.installments).toBe(0);
  });

  it("handles a profile with no income", () => {
    const [first] = cashFlowSeries({ ...profile, incomes: [] }, [], months);
    expect(first?.income).toBe(0);
    expect(first?.left).toBe(-600_000);
  });

  it("takes sinking-fund set-asides off what is left", () => {
    const fund: Commitment = {
      id: "fund",
      source: { module: "sinking-funds", refId: "fund" },
      bucket: "savings",
      payments: [{ month: "2026-11", amount: 50_000 }],
      status: "active",
    };
    const series = cashFlowSeries(profile, [fund], months);
    expect(series.map((p) => p.setAside)).toEqual([0, 50_000, 0]);
    expect(series[1]?.left).toBe(1_000_000 - 300_000 - 300_000 - 50_000);
  });
});
