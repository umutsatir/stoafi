import type { Profile } from "@stoafi/core";

const DEFAULT_PROFILE: Profile = {
  incomes: [],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

/**
 * The profile is one stored record edited from two screens (income and
 * expenses, settings). Each screen saves only its own fields; this lays them
 * over the saved profile, or over defaults when nothing is saved yet.
 */
export function mergeProfile(saved: Profile | null, patch: Partial<Profile>): Profile {
  return { ...(saved ?? DEFAULT_PROFILE), ...patch };
}
