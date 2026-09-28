import type { MonthProjection } from "../../kernel/projection";
import type { Minor } from "../../kernel/money";

/** (savings + investing buckets) / net income. */
export function savingsRate(projection: MonthProjection): number {
  if (projection.income === 0) return 0;
  const { savings, investing } = projection.byBucket;
  return (savings.committed + investing.committed) / projection.income;
}

/** Month's installment load / net income. */
export function installmentRatio(projection: MonthProjection): number {
  if (projection.income === 0) return 0;
  return projection.installmentLoad / projection.income;
}

/** Savings balance / monthly needs. */
export function emergencyFundMonths(savingsBalance: Minor, monthlyNeeds: Minor): number {
  if (monthlyNeeds === 0) return 0;
  return savingsBalance / monthlyNeeds;
}

/** Savings balance / (monthly needs + installment load). */
export function runway(savingsBalance: Minor, monthlyNeeds: Minor, installmentLoad: Minor): number {
  const denominator = monthlyNeeds + installmentLoad;
  if (denominator === 0) return 0;
  return savingsBalance / denominator;
}
