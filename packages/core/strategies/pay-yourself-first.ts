import { z } from "zod";
import { roundHalfToEven } from "../kernel/money";
import type { Bucket } from "../kernel/bucket";
import type { Minor } from "../kernel/money";
import type { MonthProjection } from "../kernel/projection";
import { netMonthlyIncome } from "../modules/profile/selectors";
import type { Profile } from "../modules/profile/schema";
import type { Insight } from "./types";

export const paramsSchema = z.object({
  savingsFirstPct: z.number().default(0.2),
  /** Share of the remainder (after savings) that goes to needs; rest goes to wants. */
  needsShareOfRemainder: z.number().default(0.6),
});

export type PayYourselfFirstParams = z.infer<typeof paramsSchema>;

export function allocate(profile: Profile, params: PayYourselfFirstParams): Record<Bucket, Minor> {
  const income = netMonthlyIncome(profile);
  const savings = roundHalfToEven(income * params.savingsFirstPct);
  const remainder = income - savings;
  const needs = roundHalfToEven(remainder * params.needsShareOfRemainder);
  const wants = remainder - needs;

  return { needs, wants, savings, investing: 0 };
}

export function diagnose(profile: Profile, projections: MonthProjection[]): Insight[] {
  const insights: Insight[] = [];
  const income = netMonthlyIncome(profile);
  const defaults = paramsSchema.parse({});
  const targetSavings = roundHalfToEven(income * defaults.savingsFirstPct);

  for (const projection of projections) {
    if (projection.byBucket.savings.committed < targetSavings) {
      insights.push({
        id: "pay-yourself-first:savings-shortfall",
        message: `Savings in ${projection.month} fell short of the pay-yourself-first target.`,
      });
    }
  }
  return insights;
}
