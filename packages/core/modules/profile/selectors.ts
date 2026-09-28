import type { Profile } from "./schema";

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
