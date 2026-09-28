import { addMonths, type Month } from "../../kernel/month";
import { roundHalfToEven } from "../../kernel/money";
import type { Minor } from "../../kernel/money";

/**
 * Estimates the month the emergency fund target would be reached at the
 * current savings pace. Returns `null` when the gap is positive and
 * `monthlySurplus` isn't enough to ever close it (never a division by
 * zero or a negative/NaN month count).
 */
export function suggestedEmergencyFundMonth(
  currentSavings: Minor,
  monthlyNeeds: Minor,
  targetMonths: number,
  monthlySurplus: Minor,
  fromMonth: Month,
): Month | null {
  const target = roundHalfToEven(monthlyNeeds * targetMonths);
  const gap = Math.max(target - currentSavings, 0);

  if (gap === 0) return fromMonth;
  if (monthlySurplus <= 0) return null;

  const monthsNeeded = Math.ceil(gap / monthlySurplus);
  return addMonths(fromMonth, monthsNeeded);
}
