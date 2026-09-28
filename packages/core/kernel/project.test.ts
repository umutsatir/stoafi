import { describe, expect, it } from "vitest";
import { project } from "./project";
import type { Commitment } from "./commitment";

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
