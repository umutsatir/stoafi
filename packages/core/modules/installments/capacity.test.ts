import { describe, expect, it } from "vitest";
import { capacityRemaining, installmentLoadTimeline } from "./capacity";
import type { Commitment } from "../../kernel/commitment";
import type { Month } from "../../kernel/month";

const months: Month[] = [
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

function installmentCommitment(
  id: string,
  payments: { month: Month; amount: number }[],
): Commitment {
  return {
    id,
    source: { module: "installments", refId: id },
    bucket: "wants",
    payments,
    status: "active",
  };
}

describe("installmentLoadTimeline", () => {
  it("sums two overlapping installment commitments per month", () => {
    const a = installmentCommitment("a", [
      { month: "2026-01", amount: 100 },
      { month: "2026-02", amount: 100 },
    ]);
    const b = installmentCommitment("b", [
      { month: "2026-02", amount: 50 },
      { month: "2026-03", amount: 50 },
    ]);

    const timeline = installmentLoadTimeline([a, b], months);
    const byMonth = new Map(timeline.map((t) => [t.month, t.load]));

    expect(byMonth.get("2026-01")).toBe(100);
    expect(byMonth.get("2026-02")).toBe(150);
    expect(byMonth.get("2026-03")).toBe(50);
    expect(byMonth.get("2026-04")).toBe(0);
  });

  it("excludes a commitment payment outside the window", () => {
    const outside = installmentCommitment("c", [{ month: "2027-01", amount: 500 }]);
    const timeline = installmentLoadTimeline([outside], months);
    expect(timeline.every((t) => t.load === 0)).toBe(true);
  });
});

describe("capacityRemaining", () => {
  it("returns cap minus current load when under the cap", () => {
    expect(capacityRemaining(10000, 0.2, 500)).toBe(1500);
  });

  it("never returns negative capacity when load already exceeds the cap", () => {
    expect(capacityRemaining(10000, 0.2, 5000)).toBe(0);
  });

  it("returns 0 when load exactly equals the cap", () => {
    expect(capacityRemaining(10000, 0.2, 2000)).toBe(0);
  });
});
