import { compareMonths, monthsBetween, type Month } from "../../kernel/month";
import type { ExpenseKind, Profile } from "./schema";

/** True when `expense` is still active in `month` (no endMonth, or month <= endMonth). */
export function isExpenseActiveInMonth(expense: { endMonth?: Month }, month: Month): boolean {
  if (!expense.endMonth) return true;
  return compareMonths(month, expense.endMonth) <= 0;
}

/** Recurring expenses that still apply in `month`. */
export function activeFixedExpenses(profile: Profile, month: Month): Profile["fixedExpenses"] {
  return profile.fixedExpenses.filter((e) => isExpenseActiveInMonth(e, month));
}

/** The kind of a recurring line; lines saved before kinds existed are regular. */
export function expenseKind(expense: { kind?: ExpenseKind }): ExpenseKind {
  return expense.kind ?? "regular";
}

/**
 * Payments still to make for a line that ends: this month's counts, so the last month gives 1.
 * `null` for a line that never ends or has already ended.
 */
export function remainingPayments(expense: { endMonth?: Month }, month: Month): number | null {
  if (!expense.endMonth) return null;
  const left = monthsBetween(month, expense.endMonth) + 1;
  return left > 0 ? left : null;
}
