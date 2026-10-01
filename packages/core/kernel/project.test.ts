import { describe, expect, it } from "vitest";
import { project, projectSeries } from "./project";
import type { Commitment } from "./commitment";
import type { Month } from "./month";

function commitment(overrides: Partial<Commitment> = {}): Commitment {
  return {
    id: "c1",
    source: { module: "queue", refId: "item-1" },
    bucket: "wants",
    payments: [{ month: "2026-09", amount: 1000 }],
    status: "active",
    ...overrides,
  };
}

describe("project (single month)", () => {
  it("returns freeCash equal to income when the ledger is empty", () => {
    const result = project({ income: 10000 }, [], "2026-09");
    expect(result.freeCash).toBe(10000);
    expect(result.byBucket.needs.committed).toBe(0);
  });

  it("sums two commitments in the same bucket and month", () => {
    const commitments = [
      commitment({ id: "c1", payments: [{ month: "2026-09", amount: 1000 }] }),
      commitment({ id: "c2", payments: [{ month: "2026-09", amount: 500 }] }),
    ];
    const result = project({ income: 10000 }, commitments, "2026-09");
    expect(result.byBucket.wants.committed).toBe(1500);
    expect(result.freeCash).toBe(8500);
  });

  it("excludes a commitment payment in a different month", () => {
    const commitments = [commitment({ payments: [{ month: "2026-10", amount: 1000 }] })];
    const result = project({ income: 10000 }, commitments, "2026-09");
    expect(result.byBucket.wants.committed).toBe(0);
    expect(result.freeCash).toBe(10000);
  });

  it("excludes draft commitments when includeDrafts is false", () => {
    const commitments = [commitment({ status: "draft" })];
    const result = project({ income: 10000 }, commitments, "2026-09", { includeDrafts: false });
    expect(result.byBucket.wants.committed).toBe(0);
  });

  it("includes draft commitments when includeDrafts is true (preview mode)", () => {
    const commitments = [commitment({ status: "draft" })];
    const result = project({ income: 10000 }, commitments, "2026-09", { includeDrafts: true });
    expect(result.byBucket.wants.committed).toBe(1000);
    expect(result.freeCash).toBe(9000);
  });
});

const twelveMonths: Month[] = [
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
  "2026-08",
  "2026-09",
  "2026-10",
  "2026-11",
  "2026-12",
];

describe("projectSeries", () => {
  it("returns freeCash === income for every month with no commitments", () => {
    const results = projectSeries({ income: 10000 }, [], twelveMonths);
    expect(results).toHaveLength(12);
    for (const r of results) {
      expect(r.freeCash).toBe(10000);
    }
  });

  it("derives installmentLoad only in the months an installment commitment pays", () => {
    const installment: Commitment = {
      id: "inst-1",
      source: { module: "installments", refId: "offer-1" },
      bucket: "wants",
      payments: [
        { month: "2026-03", amount: 1000 },
        { month: "2026-04", amount: 1000 },
        { month: "2026-05", amount: 1000 },
      ],
      status: "active",
    };

    const results = projectSeries({ income: 10000 }, [installment], twelveMonths);
    const byMonth = new Map(results.map((r) => [r.month, r]));

    expect(byMonth.get("2026-03")?.installmentLoad).toBe(1000);
    expect(byMonth.get("2026-04")?.installmentLoad).toBe(1000);
    expect(byMonth.get("2026-05")?.installmentLoad).toBe(1000);
    expect(byMonth.get("2026-02")?.installmentLoad).toBe(0);
    expect(byMonth.get("2026-06")?.installmentLoad).toBe(0);
  });
});

describe("project ignores cancelled commitments", () => {
  it("does not count a cancelled commitment even with drafts included", () => {
    const cancelled: Commitment = {
      id: "c",
      source: { module: "queue", refId: "c" },
      bucket: "wants",
      payments: [{ month: "2026-10", amount: 50_000 }],
      status: "cancelled",
    };
    const result = project({ income: 100_000 }, [cancelled], "2026-10", { includeDrafts: true });
    expect(result.byBucket.wants.committed).toBe(0);
    expect(result.freeCash).toBe(100_000);
  });
});
