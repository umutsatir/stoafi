import { compareMonths, type Month } from "../../kernel/month";
import type { Profile } from "./schema";

/** True when `expense` is still active in `month` (no endMonth, or month <= endMonth). */
export function isExpenseActiveInMonth(expense: { endMonth?: Month }, month: Month): boolean {
  if (!expense.endMonth) return true;
  return compareMonths(month, expense.endMonth) <= 0;
}

/** Recurring expenses that still apply in `month`. */
export function activeFixedExpenses(profile: Profile, month: Month): Profile["fixedExpenses"] {
  return profile.fixedExpenses.filter((e) => isExpenseActiveInMonth(e, month));
}
