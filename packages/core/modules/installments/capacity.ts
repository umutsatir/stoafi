import type { Commitment } from "../../kernel/commitment";
import type { Minor } from "../../kernel/money";
import type { Month } from "../../kernel/month";

/** Sums installment commitment payments per month across a window of months. */
export function installmentLoadTimeline(
  commitments: Commitment[],
  months: Month[],
): { month: Month; load: Minor }[] {
  return months.map((month) => {
    const load = commitments.reduce((sum, commitment) => {
      const payment = commitment.payments.find((p) => p.month === month);
      return sum + (payment?.amount ?? 0);
    }, 0);
    return { month, load };
  });
}

/**
 * Remaining room under the installment cap, given the current load.
 * `capPct` is a tunable (data, not code) passed in by the caller.
 * Never returns a negative amount — a breach shows as 0 remaining room.
 */
export function capacityRemaining(netIncome: Minor, capPct: number, currentLoad: Minor): Minor {
  const cap = netIncome * capPct;
  return Math.max(cap - currentLoad, 0);
}
