import { z } from "zod";
import { roundHalfToEven } from "../kernel/money";
import type { Bucket } from "../kernel/bucket";
import type { Minor } from "../kernel/money";
import type { MonthProjection } from "../kernel/projection";
import { monthlyNeeds, netMonthlyIncome } from "../modules/profile/selectors";
import type { Profile } from "../modules/profile/schema";
import type { Insight } from "./types";

/**
 * A params-driven approximation of Dave Ramsey's baby steps, since SPEC
 * names the strategy and its source but doesn't enumerate exact step
 * amounts/order. See TASKS.md "Open questions" for the exact-thresholds
 * question left for confirmation.
 */
export const paramsSchema = z.object({
  /** Step 1: a small starter emergency fund, flat minor-unit amount. */
  starterFundTarget: z.number().int().nonnegative().default(100_000),
  /** Step 3: share of the post-needs remainder that goes to savings. */
  step3SavingsPct: z.number().default(0.5),
  /** Step 4+: shares of the post-needs remainder once the full fund is met. */
  step4SavingsPct: z.number().default(0.2),
  step4InvestingPct: z.number().default(0.3),
});

export type BabyStepsParams = z.infer<typeof paramsSchema>;

function fullEmergencyFundTarget(profile: Profile): Minor {
  return roundHalfToEven(monthlyNeeds(profile) * profile.emergencyFundTargetMonths);
}

export function allocate(profile: Profile, params: BabyStepsParams): Record<Bucket, Minor> {
  const needs = monthlyNeeds(profile);
  const income = netMonthlyIncome(profile);
  const remainder = income - needs;
  const fullTarget = fullEmergencyFundTarget(profile);

  if (profile.savings < params.starterFundTarget) {
    return { needs, wants: 0, savings: remainder, investing: 0 };
  }

  if (profile.savings < fullTarget) {
    const savings = roundHalfToEven(remainder * params.step3SavingsPct);
    return { needs, wants: remainder - savings, savings, investing: 0 };
  }

  const savings = roundHalfToEven(remainder * params.step4SavingsPct);
  const investing = roundHalfToEven(remainder * params.step4InvestingPct);
  return { needs, wants: remainder - savings - investing, savings, investing };
}

export function diagnose(profile: Profile, projections: MonthProjection[]): Insight[] {
  const insights: Insight[] = [];
  const fullTarget = fullEmergencyFundTarget(profile);

  for (const projection of projections) {
    if (profile.savings < paramsSchema.parse({}).starterFundTarget) {
      insights.push({
        id: "baby-steps:step-1",
        message: `${projection.month}: building the starter emergency fund (step 1).`,
        month: projection.month,
      });
    } else if (projection.installmentLoad > 0) {
      insights.push({
        id: "baby-steps:step-2",
        message: `${projection.month}: pay off debt before extra saving (step 2).`,
        month: projection.month,
      });
    } else if (profile.savings < fullTarget) {
      insights.push({
        id: "baby-steps:step-3",
        message: `${projection.month}: building the full emergency fund (step 3).`,
        month: projection.month,
      });
    } else {
      insights.push({
        id: "baby-steps:step-4",
        message: `${projection.month}: emergency fund complete, investing for the future (step 4+).`,
        month: projection.month,
      });
    }
  }
  return insights;
}
