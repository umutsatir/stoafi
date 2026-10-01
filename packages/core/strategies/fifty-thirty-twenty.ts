import { z } from "zod";
import { roundHalfToEven } from "../kernel/money";
import type { Bucket } from "../kernel/bucket";
import type { Minor } from "../kernel/money";
import type { MonthProjection } from "../kernel/projection";
import { netMonthlyIncome } from "../modules/profile/selectors";
import type { Profile } from "../modules/profile/schema";
import type { Insight } from "./types";

export const paramsSchema = z.object({
  needsPct: z.number().default(0.5),
  wantsPct: z.number().default(0.3),
  savingsPct: z.number().default(0.2),
});

export type FiftyThirtyTwentyParams = z.infer<typeof paramsSchema>;

export function allocate(profile: Profile, params: FiftyThirtyTwentyParams): Record<Bucket, Minor> {
  const income = netMonthlyIncome(profile);
  return {
    needs: roundHalfToEven(income * params.needsPct),
    wants: roundHalfToEven(income * params.wantsPct),
    savings: roundHalfToEven(income * params.savingsPct),
    investing: 0,
  };
}

export function diagnose(_profile: Profile, projections: MonthProjection[]): Insight[] {
  const insights: Insight[] = [];
  for (const projection of projections) {
    if (projection.byBucket.wants.committed > projection.byBucket.wants.limit) {
      insights.push({
        id: "fifty-thirty-twenty:wants-over-limit",
        message: `Wants spending in ${projection.month} exceeds its 30% limit.`,
        month: projection.month,
      });
    }
  }
  return insights;
}
