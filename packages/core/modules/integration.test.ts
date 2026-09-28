import { describe, expect, it } from "vitest";
import { projectSeries } from "../kernel/project";
import type { Commitment } from "../kernel/commitment";
import type { Month } from "../kernel/month";
import { toCommitment } from "./sinking-funds/schema";

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

describe("installments + sinking funds feed projectSeries", () => {
  it("populates installmentLoad and sinkingSetAside only in the expected months", () => {
    const installment: Commitment = {
      id: "inst-1",
      source: { module: "installments", refId: "offer-1" },
      bucket: "wants",
      payments: [
        { month: "2026-02", amount: 1000 },
        { month: "2026-03", amount: 1000 },
      ],
      status: "active",
    };

    const sinkingFundCommitment = toCommitment(
      {
        id: "fund-1",
        label: "Car insurance",
        target: 3000,
        dueMonth: "2026-04",
        currentBalance: 0,
      },
      "2026-01",
    );

    const results = projectSeries(
      { income: 20000 },
      [installment, sinkingFundCommitment],
      twelveMonths,
    );
    const byMonth = new Map(results.map((r) => [r.month, r]));

    expect(byMonth.get("2026-02")?.installmentLoad).toBe(1000);
    expect(byMonth.get("2026-03")?.installmentLoad).toBe(1000);
    expect(byMonth.get("2026-01")?.installmentLoad).toBe(0);
    expect(byMonth.get("2026-04")?.installmentLoad).toBe(0);

    expect(byMonth.get("2026-02")?.sinkingSetAside).toBeGreaterThan(0);
    expect(byMonth.get("2026-03")?.sinkingSetAside).toBeGreaterThan(0);
    expect(byMonth.get("2026-04")?.sinkingSetAside).toBeGreaterThan(0);
    expect(byMonth.get("2026-01")?.sinkingSetAside).toBe(0);
    expect(byMonth.get("2026-05")?.sinkingSetAside).toBe(0);
  });
});
