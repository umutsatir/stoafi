import type { Month } from "../../kernel/month";
import { expenseKind, remainingPayments } from "./active-expenses";
import type { Profile } from "./schema";

/**
 * What is still to be paid on installment lines of the profile that name a card, per card id, counting
 * the payment due in `fromMonth`. It adds to what the queue's installment purchases use of the same card.
 */
export function installmentDebtByCard(profile: Profile, fromMonth: Month): Record<string, number> {
  const owed: Record<string, number> = {};
  for (const expense of profile.fixedExpenses) {
    if (expenseKind(expense) !== "installment" || !expense.cardId) continue;
    const left = remainingPayments(expense, fromMonth);
    if (left === null) continue;
    owed[expense.cardId] = (owed[expense.cardId] ?? 0) + left * expense.monthly;
  }
  return owed;
}
