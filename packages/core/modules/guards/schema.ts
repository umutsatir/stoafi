import type { Minor } from "../../kernel/money";
import type { MonthProjection } from "../../kernel/projection";

/**
 * Everything a guard rule's `check` needs, precomputed by the caller
 * (queue/plan) so each rule stays a pure comparison over data — thresholds
 * (cap %, target months) are read from this context, never hard-coded.
 */
export interface GuardContext {
  after: MonthProjection;
  savingsBalanceAfterDraft: Minor;
  monthlyNeeds: Minor;
  emergencyFundTargetMonths: number;
  /** Peak installment load across the horizon, including the draft. */
  projectedInstallmentLoad: Minor;
  netIncome: Minor;
  installmentCapPct: number;
}

export interface GuardRule {
  id: string;
  severity: "warning" | "block";
  /** Returns true when the draft breaches this rule. */
  check: (ctx: GuardContext) => boolean;
}

/**
 * SPEC's three default guard rules. Editable: the numeric thresholds live
 * in `GuardContext`, supplied by the caller from profile/plan data — this
 * array only encodes which comparisons count as a breach.
 */
export const defaultGuardRules: GuardRule[] = [
  {
    id: "emergency-fund-floor",
    severity: "block",
    check: (ctx) => ctx.savingsBalanceAfterDraft < ctx.monthlyNeeds * ctx.emergencyFundTargetMonths,
  },
  {
    id: "installment-cap",
    severity: "block",
    check: (ctx) => ctx.projectedInstallmentLoad > ctx.netIncome * ctx.installmentCapPct,
  },
  {
    id: "wants-limit",
    severity: "warning",
    check: (ctx) => ctx.after.byBucket.wants.committed > ctx.after.byBucket.wants.limit,
  },
];
