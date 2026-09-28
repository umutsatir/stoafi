import { roundHalfToEven } from "../../kernel/money";

/**
 * Monthly set-aside for a target due in `monthsRemaining` months, given
 * `saved` so far. `monthsRemaining <= 0` throws — a fund whose due date has
 * already passed is a caller-level state (e.g. overdue/urgent), not a
 * monthly amount; the caller decides how to surface that, not this formula.
 */
export function monthlySetAside(target: number, saved: number, monthsRemaining: number): number {
  if (monthsRemaining <= 0) {
    throw new Error("monthsRemaining must be positive");
  }
  const remaining = Math.max(target - saved, 0);
  return roundHalfToEven(remaining / monthsRemaining);
}
