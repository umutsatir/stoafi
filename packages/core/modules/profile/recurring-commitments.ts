import type { Commitment } from "../../kernel/commitment";
import { addMonths, type Month } from "../../kernel/month";
import { isExpenseActiveInMonth } from "./active-expenses";
import type { Profile } from "./schema";

/**
 * The profile's recurring costs as commitments, so the monthly projection sees
 * them: every recurring expense (until its `endMonth`) in its own bucket, and the
 * living-costs line as needs. Derived on every call for `horizonMonths` from
 * `fromMonth`, never stored. Lines with a zero amount, or already ended before
 * `fromMonth`, produce no commitment.
 */
export function recurringCommitments(
  profile: Profile,
  fromMonth: Month,
  horizonMonths = 24,
): Commitment[] {
  const months = Array.from({ length: horizonMonths }, (_, i) => addMonths(fromMonth, i));
  const commitments: Commitment[] = [];

  profile.fixedExpenses.forEach((expense, index) => {
    if (expense.monthly <= 0) return;
    const payments = months
      .filter((month) => isExpenseActiveInMonth(expense, month))
      .map((month) => ({ month, amount: expense.monthly }));
    if (payments.length === 0) return;
    commitments.push({
      id: `recurring-fixed-${index}`,
      source: { module: "profile", refId: `fixed-${index}` },
      bucket: expense.bucket,
      payments,
      status: "active",
    });
  });

  if (profile.livingExpenses > 0) {
    commitments.push({
      id: "recurring-living",
      source: { module: "profile", refId: "living" },
      bucket: "needs",
      payments: months.map((month) => ({ month, amount: profile.livingExpenses })),
      status: "active",
    });
  }

  return commitments;
}
