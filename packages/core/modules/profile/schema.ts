import { z } from "zod";
import { DepositSchema } from "../../kernel/deposit";
import { BUCKETS } from "../../kernel/bucket";
import { MonthSchema } from "../../kernel/month";

export const ProfileSchema = z.object({
  incomes: z.array(
    z.object({
      label: z.string(),
      monthly: z.number().int().nonnegative(),
      /** Day of month the income arrives, 1-31. Omitted reads as the 1st (see `payDayOf`). */
      payDay: z.number().int().min(1).max(31).optional(),
    }),
  ),
  fixedExpenses: z.array(
    z.object({
      label: z.string(),
      monthly: z.number().int().nonnegative(),
      bucket: z.enum(BUCKETS),
      isSubscription: z.boolean().optional(),
      /** Day of month the expense is due, 1-31. Omitted reads as the 1st (see `dueDayOf`). */
      dueDay: z.number().int().min(1).max(31).optional(),
      /** Last month this expense recurs in; omitted means it recurs indefinitely. */
      endMonth: MonthSchema.optional(),
    }),
  ),
  /** One lump monthly line for day-to-day living costs (groceries etc.); counted as needs. */
  livingExpenses: z.number().int().nonnegative(),
  savings: z.number().int().nonnegative(),
  /** Money put into or taken out of the emergency fund by hand; `savings` moves with it. */
  deposits: z.array(DepositSchema).optional(),
  emergencyFundTargetMonths: z.number().nonnegative(),
  annualInflationExpectation: z.number(),
  /** ISO 3166 country the inflation suggestion came from; remembered so the form can show it again. */
  countryCode: z.string().optional(),
  hourlyNetIncome: z.number().int().nonnegative().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;
