import { z } from "zod";
import { roundHalfToEven } from "../kernel/money";
import type { Bucket } from "../kernel/bucket";
import type { Minor } from "../kernel/money";
import type { MonthProjection } from "../kernel/projection";
import { netMonthlyIncome } from "../modules/profile/selectors";
import type { Profile } from "../modules/profile/schema";
import type { Insight } from "./types";

/**
 * Ramit Sethi's four categories, mapped onto the app's bucket set:
 * fixed costs -> needs, investments -> investing, savings -> savings,
 * guilt-free spending -> wants.
 */
export const paramsSchema = z.object({
  fixedCostsPct: z.number().default(0.6),
  investingPct: z.number().default(0.1),
  savingsPct: z.number().default(0.1),
  guiltFreePct: z.number().default(0.2),
});

export type ConsciousSpendingParams = z.infer<typeof paramsSchema>;

export function allocate(profile: Profile, params: ConsciousSpendingParams): Record<Bucket, Minor> {
  const income = netMonthlyIncome(profile);
  return {
    needs: roundHalfToEven(income * params.fixedCostsPct),
    investing: roundHalfToEven(income * params.investingPct),
    savings: roundHalfToEven(income * params.savingsPct),
    wants: roundHalfToEven(income * params.guiltFreePct),
  };
}

export function diagnose(_profile: Profile, projections: MonthProjection[]): Insight[] {
  const insights: Insight[] = [];
  for (const projection of projections) {
    if (projection.byBucket.wants.committed > projection.byBucket.wants.limit) {
      insights.push({
        id: "conscious-spending:guilt-free-over-limit",
        message: `Guilt-free spending in ${projection.month} exceeds its limit.`,
      });
    }
  }
  return insights;
}
