import { describe, expect, it } from "vitest";
import type { MonthProjection } from "../../kernel/projection";
import { healthSummary, metricStatus, monthlySavingRate, type HealthInputs } from "./status";

const projection = (over: Partial<MonthProjection> = {}): MonthProjection => ({
  month: "2026-10",
  income: 10_000,
  byBucket: {
    needs: { limit: 5000, committed: 4000 },
    wants: { limit: 3000, committed: 2000 },
    savings: { limit: 2000, committed: 0 },
    investing: { limit: 0, committed: 0 },
  },
  installmentLoad: 0,
  sinkingSetAside: 0,
  freeCash: 4000,
  ...over,
});

const inputs = (over: Partial<HealthInputs> = {}): HealthInputs => ({
  projection: projection(),
  savingsBalance: 30_000,
  monthlyNeeds: 5_000,
  depositedThisMonth: 2_000,
  emergencyFundTargetMonths: 6,
  installmentCapPct: 0.2,
  ...over,
});

describe("monthlySavingRate", () => {
  it("counts money put into pots and the recurring savings and investing lines", () => {
    const p = projection({
      byBucket: {
        needs: { limit: 0, committed: 0 },
        wants: { limit: 0, committed: 0 },
        savings: { limit: 0, committed: 500 },
        investing: { limit: 0, committed: 700 },
      },
    });
    expect(monthlySavingRate(p, 800)).toBeCloseTo(0.2, 10);
  });

  it("does not count a pot's planned set-aside twice when money was also put into it", () => {
    const p = projection({
      byBucket: {
        needs: { limit: 0, committed: 0 },
        wants: { limit: 0, committed: 0 },
        savings: { limit: 0, committed: 1_000 },
        investing: { limit: 0, committed: 0 },
      },
      sinkingSetAside: 1_000,
    });
    expect(monthlySavingRate(p, 1_000)).toBeCloseTo(0.1, 10);
  });

  it("is zero without income and never negative when money was taken out", () => {
    expect(monthlySavingRate(projection({ income: 0 }), 500)).toBe(0);
    expect(monthlySavingRate(projection(), -5_000)).toBe(0);
  });
});

describe("metricStatus", () => {
  it("rates the savings rate against the data thresholds", () => {
    expect(metricStatus("savingsRate", 0.2, inputs())).toBe("good");
    expect(metricStatus("savingsRate", 0.15, inputs())).toBe("watch");
    expect(metricStatus("savingsRate", 0.05, inputs())).toBe("risk");
  });

  it("rates the emergency fund against the user's own target months", () => {
    expect(metricStatus("emergencyFundMonths", 6, inputs())).toBe("good");
    expect(metricStatus("emergencyFundMonths", 4, inputs())).toBe("watch");
    expect(metricStatus("emergencyFundMonths", 1, inputs())).toBe("risk");
    // a one-month target is met at one month
    expect(metricStatus("emergencyFundMonths", 1, inputs({ emergencyFundTargetMonths: 1 }))).toBe(
      "good",
    );
  });

  it("rates the installment ratio against the user's cap", () => {
    expect(metricStatus("installmentRatio", 0.2, inputs())).toBe("good");
    expect(metricStatus("installmentRatio", 0.25, inputs())).toBe("watch");
    expect(metricStatus("installmentRatio", 0.31, inputs())).toBe("risk");
  });

  it("rates the runway", () => {
    expect(metricStatus("runway", 6, inputs())).toBe("good");
    expect(metricStatus("runway", 4, inputs())).toBe("watch");
    expect(metricStatus("runway", 2.9, inputs())).toBe("risk");
  });
});

describe("healthSummary", () => {
  it("is good when every metric is good, with nothing to do", () => {
    const summary = healthSummary(inputs());
    expect(summary.overall).toBe("good");
    expect(summary.steps).toEqual([]);
    expect(summary.metrics.emergencyFundMonths.value).toBe(6);
  });

  it("takes the worst status as the overall one and says what to fix, most serious first", () => {
    const summary = healthSummary(
      inputs({
        savingsBalance: 5_000,
        depositedThisMonth: 0,
        projection: projection({ installmentLoad: 3_500 }),
      }),
    );
    expect(summary.overall).toBe("risk");
    expect(summary.metrics.installmentRatio.status).toBe("risk");
    expect(summary.steps.map((s) => s.id)).toEqual([
      "build-emergency-fund",
      "reduce-installments",
      "start-saving",
    ]);
    expect(summary.steps[0]).toMatchObject({ severity: "risk", href: "/sinking-funds" });
    expect(summary.steps.find((s) => s.id === "reduce-installments")?.href).toBe("/queue");
  });

  it("suggests nothing about savings for someone with no income yet", () => {
    const summary = healthSummary(
      inputs({ projection: projection({ income: 0 }), monthlyNeeds: 0 }),
    );
    expect(summary.steps).toEqual([]);
  });
});
