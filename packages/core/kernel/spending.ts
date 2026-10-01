import type { Minor } from "./money";
import { roundHalfToEven } from "./money";

export interface FreeSpending {
  /** What can go to going out, friends and shopping this month. */
  monthly: Minor;
  /** The same spread evenly over the month's weeks and days; a way to picture it, not a limit. */
  weekly: Minor;
  daily: Minor;
  /** True when the user set the amount; false when it is what is left of the wants limit. */
  fixed: boolean;
}

export interface FreeSpendingInput {
  /** The wants limit and what is already committed in it (which includes a set personal amount). */
  wantsLimit: Minor;
  wantsCommitted: Minor;
  /** The amount the user set for personal spending, if any. */
  personal?: Minor;
  daysInMonth: number;
}

/**
 * The money for everyday fun: the amount the user set, or else what is left of the wants limit after
 * subscriptions, installments and other wants lines. Never negative. Weekly and daily are the monthly
 * amount spread over the days, rounded once.
 */
export function freeSpending(input: FreeSpendingInput): FreeSpending {
  const fixed = input.personal !== undefined && input.personal > 0;
  const monthly = fixed
    ? (input.personal as number) // checked just above
    : Math.max(0, input.wantsLimit - input.wantsCommitted);
  const days = Math.max(1, input.daysInMonth);
  return {
    monthly,
    weekly: roundHalfToEven((monthly * 7) / days),
    daily: roundHalfToEven(monthly / days),
    fixed,
  };
}
