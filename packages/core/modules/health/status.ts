import thresholds from "../../data/health-thresholds.json";
import type { Minor } from "../../kernel/money";
import type { MonthProjection } from "../../kernel/projection";
import { emergencyFundMonths, installmentRatio, runway } from "./selectors";

export type HealthStatus = "good" | "watch" | "risk";
export type HealthMetricKind =
  "savingsRate" | "emergencyFundMonths" | "installmentRatio" | "runway";

export interface HealthInputs {
  projection: MonthProjection;
  savingsBalance: Minor;
  monthlyNeeds: Minor;
  /** Net money put into pots and the emergency fund this month. */
  depositedThisMonth: Minor;
  emergencyFundTargetMonths: number;
  /** The user's installment cap as a share of income (a setting). */
  installmentCapPct: number;
}

/**
 * Share of income set aside this month: money put into pots by hand plus the recurring savings and
 * investing lines. A pot's planned set-aside is left out of the lines so it is not counted twice.
 */
export function monthlySavingRate(projection: MonthProjection, depositedThisMonth: Minor): number {
  if (projection.income === 0) return 0;
  const { savings, investing } = projection.byBucket;
  const recurring = savings.committed - projection.sinkingSetAside + investing.committed;
  return Math.max(0, recurring + depositedThisMonth) / projection.income;
}

export function metricStatus(
  kind: HealthMetricKind,
  value: number,
  inputs: HealthInputs,
): HealthStatus {
  switch (kind) {
    case "savingsRate":
      if (value >= thresholds.savingsRate.good) return "good";
      return value >= thresholds.savingsRate.watch ? "watch" : "risk";
    case "emergencyFundMonths":
      if (value >= inputs.emergencyFundTargetMonths) return "good";
      return value >=
        Math.min(thresholds.emergencyFundWatchMonths, inputs.emergencyFundTargetMonths)
        ? "watch"
        : "risk";
    case "installmentRatio":
      if (value <= inputs.installmentCapPct) return "good";
      return value <= inputs.installmentCapPct * thresholds.installmentRatio.watchFactor
        ? "watch"
        : "risk";
    case "runway":
      if (value >= thresholds.runwayMonths.good) return "good";
      return value >= thresholds.runwayMonths.watch ? "watch" : "risk";
  }
}

export interface HealthStep {
  id: "build-emergency-fund" | "reduce-installments" | "start-saving" | "extend-runway";
  severity: "watch" | "risk";
  /** The page that helps. */
  href: string;
}

export interface HealthSummary {
  overall: HealthStatus;
  metrics: Record<HealthMetricKind, { value: number; status: HealthStatus }>;
  steps: HealthStep[];
}

const RANK: Record<HealthStatus, number> = { good: 0, watch: 1, risk: 2 };

/** Every metric with its status, the overall status (the worst one) and up to four things to fix. */
export function healthSummary(inputs: HealthInputs): HealthSummary {
  const { projection, savingsBalance, monthlyNeeds } = inputs;
  const values: Record<HealthMetricKind, number> = {
    savingsRate: monthlySavingRate(projection, inputs.depositedThisMonth),
    emergencyFundMonths: emergencyFundMonths(savingsBalance, monthlyNeeds),
    installmentRatio: installmentRatio(projection),
    runway: runway(savingsBalance, monthlyNeeds, projection.installmentLoad),
  };
  const metrics = Object.fromEntries(
    (Object.keys(values) as HealthMetricKind[]).map((kind) => [
      kind,
      { value: values[kind], status: metricStatus(kind, values[kind], inputs) },
    ]),
  ) as HealthSummary["metrics"];

  const hasData = projection.income > 0 || monthlyNeeds > 0;
  const steps: HealthStep[] = [];
  const add = (step: HealthStep) => steps.push(step);
  const fund = metrics.emergencyFundMonths.status;
  const ratio = metrics.installmentRatio.status;
  const rate = metrics.savingsRate.status;
  const run = metrics.runway.status;
  if (hasData && fund !== "good")
    add({ id: "build-emergency-fund", severity: fund, href: "/sinking-funds" });
  if (ratio !== "good") add({ id: "reduce-installments", severity: ratio, href: "/queue" });
  if (hasData && projection.income > 0 && rate !== "good")
    add({ id: "start-saving", severity: rate, href: "/sinking-funds" });
  if (hasData && run !== "good" && fund === "good")
    add({ id: "extend-runway", severity: run, href: "/income-expenses" });

  const overall = (Object.values(metrics) as { status: HealthStatus }[]).reduce<HealthStatus>(
    (worst, m) => (RANK[m.status] > RANK[worst] ? m.status : worst),
    "good",
  );
  return { overall: hasData ? overall : "good", metrics, steps };
}
