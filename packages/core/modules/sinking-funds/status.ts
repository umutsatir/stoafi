import { monthsBetween, type Month } from "../../kernel/month";
import type { Commitment } from "../../kernel/commitment";
import type { Minor } from "../../kernel/money";
import { toCommitment, type SinkingFund } from "./schema";
import { monthlySetAside } from "./selectors";

export type SinkingFundStatus =
  | { state: "funded"; monthsRemaining: number }
  /** No due date: nothing is asked of the user each month; they put in what they like. */
  | { state: "open" }
  | { state: "active"; monthsRemaining: number; monthlySetAside: Minor }
  | { state: "due"; monthsRemaining: 0; missing: Minor }
  | { state: "overdue"; monthsRemaining: number; missing: Minor };

/**
 * Where a fund stands in `fromMonth`. Set-asides run from the next month up to
 * and including the due month, so a fund due this month has nothing left to
 * spread: it is "due" and shows what is still missing, instead of the
 * `monthlySetAside` error for a non-positive number of months.
 */
export function sinkingFundStatus(fund: SinkingFund, fromMonth: Month): SinkingFundStatus {
  if (!fund.dueMonth) {
    return fund.target > 0 && fund.currentBalance >= fund.target
      ? { state: "funded", monthsRemaining: 0 }
      : { state: "open" };
  }
  const monthsRemaining = monthsBetween(fromMonth, fund.dueMonth);
  if (fund.currentBalance >= fund.target) return { state: "funded", monthsRemaining };

  const missing = fund.target - fund.currentBalance;
  if (monthsRemaining === 0) return { state: "due", monthsRemaining, missing };
  if (monthsRemaining < 0) return { state: "overdue", monthsRemaining, missing };

  return {
    state: "active",
    monthsRemaining,
    monthlySetAside: monthlySetAside(fund.target, fund.currentBalance, monthsRemaining),
  };
}

/** Ledger commitments for every fund that still has months to run; due and overdue funds have none. */
export function sinkingFundCommitments(funds: SinkingFund[], fromMonth: Month): Commitment[] {
  return funds
    .filter((fund) => fund.dueMonth !== undefined && monthsBetween(fromMonth, fund.dueMonth) > 0)
    .map((fund) => toCommitment(fund, fromMonth));
}
