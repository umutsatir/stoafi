import { describe, expect, it } from "vitest";
import {
  SnapshotSchema,
  buildSnapshot,
  sameSnapshot,
  trendOf,
  upsertSnapshot,
  type Snapshot,
} from "./snapshots";

const snap = (month: string, over: Partial<Snapshot> = {}): Snapshot => ({
  id: month,
  month: month as Snapshot["month"],
  income: 6_000_000,
  left: 1_700_000,
  savingsRate: 0.1,
  installmentRatio: 0.13,
  emergencyMonths: 2.6,
  runwayMonths: 2.1,
  wealth: 12_000_000,
  ...over,
});

describe("buildSnapshot", () => {
  it("records the month's numbers with the month as its id", () => {
    const built = buildSnapshot({
      month: "2026-10",
      income: 6_000_000,
      left: 1_700_000,
      savingsRate: 0.1,
      installmentRatio: 0.13,
      emergencyMonths: 2.6,
      runwayMonths: 2.1,
      savings: 9_000_000,
      potsTotal: 350_000,
      portfolioValue: 3_750_000,
    });
    expect(built).toMatchObject({
      id: "2026-10",
      month: "2026-10",
      wealth: 9_000_000 + 350_000 + 3_750_000,
    });
    expect(SnapshotSchema.safeParse(built).success).toBe(true);
  });

  it("rounds ratios so tiny float noise does not look like a change", () => {
    const a = buildSnapshot({
      month: "2026-10",
      income: 1,
      left: 1,
      savingsRate: 0.1 + 0.2,
      installmentRatio: 0,
      emergencyMonths: 1,
      runwayMonths: 1,
      savings: 0,
      potsTotal: 0,
      portfolioValue: 0,
    });
    expect(a.savingsRate).toBe(0.3);
  });
});

describe("upsertSnapshot", () => {
  it("adds a new month in date order and replaces an existing one", () => {
    const list = [snap("2026-08"), snap("2026-10")];
    expect(upsertSnapshot(list, snap("2026-09")).map((s) => s.month)).toEqual([
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
    const replaced = upsertSnapshot(list, snap("2026-10", { left: 5 }));
    expect(replaced).toHaveLength(2);
    expect(replaced[1]?.left).toBe(5);
  });

  it("does not change the list it was given", () => {
    const list = [snap("2026-08")];
    upsertSnapshot(list, snap("2026-09"));
    expect(list).toHaveLength(1);
  });
});

describe("sameSnapshot", () => {
  it("is true for identical numbers and false when anything differs", () => {
    expect(sameSnapshot(snap("2026-10"), snap("2026-10"))).toBe(true);
    expect(sameSnapshot(snap("2026-10"), snap("2026-10", { left: 1 }))).toBe(false);
    expect(sameSnapshot(undefined, snap("2026-10"))).toBe(false);
  });
});

describe("trendOf", () => {
  const list = [
    snap("2026-06", { savingsRate: 0.05 }),
    snap("2026-07", { savingsRate: 0.08 }),
    snap("2026-08", { savingsRate: 0.1 }),
    snap("2026-09", { savingsRate: 0.12 }),
  ];

  it("gives the last few months of one number, oldest first, and the change since the month before", () => {
    const trend = trendOf(list, "savingsRate", 3);
    expect(trend.points).toEqual([0.08, 0.1, 0.12]);
    expect(trend.change).toBeCloseTo(0.02, 10);
  });

  it("has no change with a single month, and nothing for no months", () => {
    expect(trendOf([snap("2026-09")], "left", 6)).toEqual({ points: [1_700_000], change: null });
    expect(trendOf([], "left", 6)).toEqual({ points: [], change: null });
  });

  it("works with a month count larger than the history", () => {
    expect(trendOf(list, "savingsRate", 24).points).toHaveLength(4);
  });
});
