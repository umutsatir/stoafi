import { describe, expect, it } from "vitest";
import type { Commitment } from "../../kernel/commitment";
import { committedByCategory } from "./category-breakdown";
import { recurringCommitments } from "./recurring-commitments";
import type { Profile } from "./schema";

const profile: Profile = {
  incomes: [{ label: "Job", monthly: 5_000_000 }],
  fixedExpenses: [
    { label: "Rent", monthly: 1_600_000, bucket: "needs" },
    { label: "Streaming", monthly: 25_000, bucket: "wants" },
    { label: "Phone", monthly: 150_000, bucket: "needs", kind: "installment", endMonth: "2027-03" },
    { label: "Car loan", monthly: 380_000, bucket: "needs", kind: "loan", endMonth: "2027-12" },
    { label: "Gold", monthly: 200_000, bucket: "investing" },
  ],
  livingExpenses: 1_200_000,
  personalSpending: 700_000,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

const queueInstallment: Commitment = {
  id: "installment-fridge",
  source: { module: "installments", refId: "fridge" },
  bucket: "needs",
  payments: [{ month: "2026-10", amount: 90_000 }],
  status: "active",
};
const pot: Commitment = {
  id: "pot",
  source: { module: "sinking-funds", refId: "insurance" },
  bucket: "savings",
  payments: [{ month: "2026-10", amount: 100_000 }],
  status: "active",
};

const find = (rows: ReturnType<typeof committedByCategory>, bucket: string, category: string) =>
  rows.find((r) => r.bucket === bucket && r.category === category);

describe("committedByCategory", () => {
  const rows = committedByCategory(
    profile,
    [...recurringCommitments(profile, "2026-10", 3), queueInstallment, pot],
    "2026-10",
  );

  it("separates bills, living costs, installments and loans inside the needs bucket", () => {
    expect(find(rows, "needs", "bills")?.amount).toBe(1_600_000);
    expect(find(rows, "needs", "living")?.amount).toBe(1_200_000);
    expect(find(rows, "needs", "loans")?.amount).toBe(380_000);
    // the phone line and the fridge bought through the queue are both installments
    expect(find(rows, "needs", "installments")?.amount).toBe(150_000 + 90_000);
  });

  it("names the lines it knows, and keeps only the id for purchases it does not own", () => {
    const items = find(rows, "needs", "installments")?.items ?? [];
    expect(items.find((i) => i.key === "fixed-2")?.label).toBe("Phone");
    expect(items.find((i) => i.key === "fridge")?.label).toBeNull();
  });

  it("puts regular saving and investing lines under saving, and pots under pots", () => {
    expect(find(rows, "investing", "saving")?.amount).toBe(200_000);
    expect(find(rows, "savings", "pots")?.amount).toBe(100_000);
  });

  it("shows personal spending apart from bills in the wants bucket", () => {
    expect(find(rows, "wants", "personal")?.amount).toBe(700_000);
  });

  it("puts a want line under bills in the wants bucket", () => {
    expect(find(rows, "wants", "bills")?.amount).toBe(25_000);
  });

  it("adds up to everything committed, ignoring other months, drafts and cancelled ones", () => {
    const draft: Commitment = { ...queueInstallment, id: "d", status: "draft" };
    const other: Commitment = {
      ...queueInstallment,
      id: "o",
      payments: [{ month: "2026-11", amount: 5_000_000 }],
    };
    const all = committedByCategory(profile, [queueInstallment, draft, other], "2026-10");
    expect(all.reduce((sum, r) => sum + r.amount, 0)).toBe(90_000);
  });

  it("handles a line the profile no longer has", () => {
    const orphan: Commitment = {
      ...queueInstallment,
      id: "x",
      source: { module: "profile", refId: "fixed-99" },
    };
    const result = committedByCategory(profile, [orphan], "2026-10");
    expect(result[0]).toMatchObject({ category: "bills", amount: 90_000 });
    expect(result[0]?.items[0]?.label).toBeNull();
  });
});
