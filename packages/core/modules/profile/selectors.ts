import type { Month } from "../../kernel/month";
import { activeFixedExpenses } from "./active-expenses";
import type { Profile } from "./schema";

/** Day of month an income arrives; the 1st when not set. */
export function payDayOf(income: { payDay?: number }): number {
  return income.payDay ?? 1;
}

/** Day of month an expense is due; the 1st when not set. */
export function dueDayOf(expense: { dueDay?: number }): number {
  return expense.dueDay ?? 1;
}

export function netMonthlyIncome(profile: Profile): number {
  return profile.incomes.reduce((sum, income) => sum + income.monthly, 0);
}

/**
 * Hourly net income: uses the profile's explicit value if set, otherwise
 * derives it from net monthly income over `hoursPerMonth` (default 160).
 */
export function hourlyNetIncome(profile: Profile, hoursPerMonth = 160): number {
  if (profile.hourlyNetIncome !== undefined) {
    return profile.hourlyNetIncome;
  }
  if (hoursPerMonth === 0) return 0;
  return netMonthlyIncome(profile) / hoursPerMonth;
}

/**
 * Needs-bucket recurring obligations plus the lump living-costs line. With a
 * `month`, expenses whose `endMonth` has passed are left out; without one every
 * expense counts (the month-agnostic figure strategies allocate from).
 */
export function monthlyNeeds(profile: Profile, month?: Month): number {
  const expenses = month ? activeFixedExpenses(profile, month) : profile.fixedExpenses;
  const fixedNeeds = expenses
    .filter((e) => e.bucket === "needs")
    .reduce((sum, e) => sum + e.monthly, 0);
  return fixedNeeds + profile.livingExpenses;
}
