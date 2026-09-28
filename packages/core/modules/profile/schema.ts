import { z } from "zod";
import { BUCKETS } from "../../kernel/bucket";

export const ProfileSchema = z.object({
  incomes: z.array(
    z.object({
      label: z.string(),
      monthly: z.number().int().nonnegative(),
      variable: z.boolean(),
    }),
  ),
  fixedExpenses: z.array(
    z.object({
      label: z.string(),
      monthly: z.number().int().nonnegative(),
      bucket: z.enum(BUCKETS),
      isSubscription: z.boolean().optional(),
    }),
  ),
  avgVariableExpenses: z.array(
    z.object({
      label: z.string(),
      monthly: z.number().int().nonnegative(),
      bucket: z.enum(BUCKETS),
    }),
  ),
  savings: z.number().int().nonnegative(),
  emergencyFundTargetMonths: z.number().nonnegative(),
  annualInflationExpectation: z.number(),
  hourlyNetIncome: z.number().int().nonnegative().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;
