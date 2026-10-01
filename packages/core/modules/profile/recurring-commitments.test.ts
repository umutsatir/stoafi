import { describe, expect, it } from "vitest";
import { CommitmentSchema, type Commitment } from "../../kernel/commitment";
import type { Month } from "../../kernel/month";
import { project, projectSeries } from "../../kernel/project";
import { currentAllocation } from "../plan/selectors";
import { scheduleQueue } from "../queue/scheduler";
import type { QueueItem } from "../queue/schema";
import { cashFlowSeries } from "./cash-flow";
import { recurringCommitments } from "./recurring-commitments";
import type { Profile } from "./schema";
import { netMonthlyIncome } from "./selectors";

const profile: Profile = {
  incomes: [{ label: "Job", monthly: 1_000_000 }],
  fixedExpenses: [
    { label: "Rent", monthly: 200_000, bucket: "needs" },
    { label: "Streaming", monthly: 10_000, bucket: "wants" },
    { label: "Car loan", monthly: 100_000, bucket: "needs", endMonth: "2026-11" },
  ],
  livingExpenses: 300_000,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

const income = netMonthlyIncome(profile);

describe("recurringCommitments", () => {
  it("makes valid, active commitments sourced from the profile", () => {
    const commitments = recurringCommitments(profile, "2026-10", 6);
    expect(commitments.length).toBeGreaterThan(0);
    for (const c of commitments) {
      expect(CommitmentSchema.safeParse(c).success).toBe(true);
      expect(c.status).toBe("active");
      expect(c.source.module).toBe("profile");
    }
  });

  it("fills the buckets and lowers free cash by every recurring cost", () => {
    const month = project({ income }, recurringCommitments(profile, "2026-10", 6), "2026-10");
    expect(month.byBucket.needs.committed).toBe(600_000); // rent + car loan + living
    expect(month.byBucket.wants.committed).toBe(10_000);
    expect(month.freeCash).toBe(income - 610_000);
  });

  it("stops an expense after its end month but keeps the rest", () => {
    const ledger = recurringCommitments(profile, "2026-10", 6);
    const series = projectSeries({ income }, ledger, ["2026-11", "2026-12"] as Month[]);
    expect(series[0]?.byBucket.needs.committed).toBe(600_000);
    expect(series[1]?.byBucket.needs.committed).toBe(500_000);
  });

  it("covers exactly the requested horizon", () => {
    const rent = recurringCommitments(profile, "2026-10", 6).find(
      (c) => c.source.refId === "fixed-0",
    );
    expect(rent?.payments.map((p) => p.month)).toEqual([
      "2026-10",
      "2026-11",
      "2026-12",
      "2027-01",
      "2027-02",
      "2027-03",
    ]);
  });

  it("leaves out an expense that already ended and zero-amount lines", () => {
    const quiet: Profile = {
      ...profile,
      fixedExpenses: [
        { label: "Old loan", monthly: 100_000, bucket: "needs", endMonth: "2026-01" },
        { label: "Free trial", monthly: 0, bucket: "wants" },
      ],
      livingExpenses: 0,
    };
    expect(recurringCommitments(quiet, "2026-10", 6)).toEqual([]);
  });

  it("returns nothing for an empty profile", () => {
    const empty: Profile = { ...profile, fixedExpenses: [], livingExpenses: 0 };
    expect(recurringCommitments(empty, "2026-10", 12)).toEqual([]);
  });

  it("agrees with cashFlowSeries on what is left each month, installments included", () => {
    const installment: Commitment = {
      id: "installment-fridge",
      source: { module: "installments", refId: "fridge" },
      bucket: "needs",
      payments: [
        { month: "2026-10", amount: 50_000 },
        { month: "2026-11", amount: 50_000 },
      ],
      status: "active",
    };
    const months: Month[] = ["2026-10", "2026-11", "2026-12", "2027-01"];
    const ledger = [...recurringCommitments(profile, "2026-10", 12), installment];
    const left = projectSeries({ income }, ledger, months).map((p) => p.freeCash);
    expect(left).toEqual(cashFlowSeries(profile, [installment], months).map((p) => p.left));
  });
});

describe("scheduling against recurring costs", () => {
  const plan = { strategyId: "fifty-thirty-twenty", params: {} };
  const need: QueueItem = {
    id: "boiler",
    name: "Boiler",
    price: 150_000,
    urgency: 3,
    importance: 3,
    isNeed: true,
    expectedUses: 1,
    addedDate: "2020-01-01",
    priceUpdatedDate: "2020-01-01",
    order: 0,
  };

  it("fits a need when nothing else uses the needs bucket", () => {
    const bare: Profile = { ...profile, fixedExpenses: [], livingExpenses: 0 };
    const result = scheduleQueue([need], bare, plan, [], "2026-10-01", "2026-10");
    expect(result[0]?.month).toBe("2026-10");
  });

  it("never places a need while rent and living costs leave no room in the needs limit", () => {
    // 50% of 10,000.00 is 5,000.00. Rent + loan + living = 6,000.00 now and exactly
    // 5,000.00 once the loan ends, so a 1,500.00 need has no room in any month.
    expect(currentAllocation(profile, plan).needs).toBe(500_000);
    const ledger = recurringCommitments(profile, "2026-10", 24);
    const result = scheduleQueue([need], profile, plan, ledger, "2026-10-01", "2026-10");
    expect(result[0]?.month).toBeNull();
  });

  it("places a need in the first month a loan's end frees enough room", () => {
    const lighter: Profile = { ...profile, livingExpenses: 200_000 };
    // needs: 5,000.00 until the loan ends after 2026-11, then 4,000.00 from 2026-12
    const small: QueueItem = { ...need, price: 80_000 };
    const ledger = recurringCommitments(lighter, "2026-10", 24);
    const result = scheduleQueue([small], lighter, plan, ledger, "2026-10-01", "2026-10");
    expect(result[0]?.month).toBe("2026-12");
  });
});

describe("installments and loans entered as expenses", () => {
  const withInstallment: Profile = {
    ...profile,
    fixedExpenses: [
      { label: "Rent", monthly: 200_000, bucket: "needs" },
      {
        label: "Phone",
        monthly: 50_000,
        bucket: "needs",
        kind: "installment",
        endMonth: "2027-03",
      },
      { label: "Loan", monthly: 80_000, bucket: "needs", kind: "loan", endMonth: "2027-06" },
    ],
  };

  it("count toward the installment load, which a regular cost does not", () => {
    const month = project(
      { income },
      recurringCommitments(withInstallment, "2026-10", 6),
      "2026-10",
    );
    expect(month.installmentLoad).toBe(130_000);
  });

  it("still fill their own bucket", () => {
    const month = project(
      { income },
      recurringCommitments(withInstallment, "2026-10", 6),
      "2026-10",
    );
    expect(month.byBucket.needs.committed).toBe(200_000 + 50_000 + 80_000 + 300_000);
  });
});

describe("personal spending", () => {
  const withPersonal: Profile = { ...profile, personalSpending: 150_000 };

  it("counts as wants every month", () => {
    const month = project({ income }, recurringCommitments(withPersonal, "2026-10", 6), "2026-10");
    const without = project({ income }, recurringCommitments(profile, "2026-10", 6), "2026-10");
    expect(month.byBucket.wants.committed - without.byBucket.wants.committed).toBe(150_000);
  });

  it("adds nothing when it is not set", () => {
    const ids = recurringCommitments(profile, "2026-10", 3).map((c) => c.id);
    expect(ids).not.toContain("recurring-personal");
  });
});
