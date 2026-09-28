import { z } from "zod";
import { addMonths, monthsBetween, MonthSchema, type Month } from "../../kernel/month";
import type { Commitment } from "../../kernel/commitment";
import { monthlySetAside } from "./selectors";

export const SinkingFundSchema = z.object({
  id: z.string(),
  label: z.string(),
  target: z.number().int().nonnegative(),
  dueMonth: MonthSchema,
  currentBalance: z.number().int().nonnegative(),
});

export type SinkingFund = z.infer<typeof SinkingFundSchema>;

/**
 * Turns a sinking fund into a commitment with one payment per month
 * remaining until its due month, each computed via `monthlySetAside`.
 */
export function toCommitment(fund: SinkingFund, fromMonth: Month): Commitment {
  const monthsRemaining = monthsBetween(fromMonth, fund.dueMonth);
  const amount = monthlySetAside(fund.target, fund.currentBalance, monthsRemaining);

  const payments = Array.from({ length: monthsRemaining }, (_, index) => ({
    month: addMonths(fromMonth, index + 1),
    amount,
  }));

  return {
    id: fund.id,
    source: { module: "sinking-funds", refId: fund.id },
    bucket: "savings",
    payments,
    status: "active",
  };
}
