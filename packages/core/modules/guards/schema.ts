import { z } from "zod";
import type { Minor } from "../../kernel/money";
import type { MonthProjection } from "../../kernel/projection";

/** Editable guard thresholds, e.g. the installment cap percentage. */
export const GuardThresholdsSchema = z.object({
  installmentCapPct: z.number().min(0).max(1).default(0.2),
});

export type GuardThresholds = z.infer<typeof GuardThresholdsSchema>;

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
  /**
   * How far the draft pushes the chosen card (with its supplementary cards) over its shared limit.
   * Zero or missing when no card was chosen, the limit is unknown or the draft fits.
   */
  cardLimitOverBy?: Minor;
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
    id: "card-limit",
    severity: "warning",
    check: (ctx) => (ctx.cardLimitOverBy ?? 0) > 0,
  },
  {
    id: "wants-limit",
    severity: "warning",
    check: (ctx) => ctx.after.byBucket.wants.committed > ctx.after.byBucket.wants.limit,
  },
];
