import { depositedInMonth } from "../../kernel/deposit";
import type { Minor } from "../../kernel/money";
import type { Month } from "../../kernel/month";
import type { SinkingFund } from "./schema";
import { sinkingFundStatus } from "./status";

/** What a pot needs this month: its monthly set-aside, or what is still missing once it is due or overdue. */
export function requiredThisMonth(fund: SinkingFund, month: Month): Minor {
  const status = sinkingFundStatus(fund, month);
  if (status.state === "funded" || status.state === "open") return 0;
  if (status.state === "active") return status.monthlySetAside;
  return status.missing;
}

export interface SavingsAdviceInput {
  /** Money left this month before any saving: income minus needs, wants and installments. */
  freeBeforeSaving: Minor;
  /** What the active plan suggests setting aside this month. */
  planSavings: Minor;
  funds: SinkingFund[];
  /** The emergency fund: how far below its target it is, and what went in this month. */
  emergency?: { gap: Minor; depositedThisMonth: Minor };
  month: Month;
}

export interface SavingsAdvice {
  required: Minor;
  deposited: Minor;
  stillToSet: Minor;
  freeAfter: Minor;
  /** The part of the plan meant for investing: nothing while the emergency fund is short, else what pots do not need. */
  investingShare: Minor;
  /** Where the remaining amount could go; each pot only up to its own need this month. */
  suggestedSplit: { id: string; amount: Minor }[];
}

/**
 * The month's saving picture: what to set aside, what already went in, what is left to set aside
 * and what stays free afterwards. A suggestion only; the user decides where money goes.
 */
export function monthlySavingsAdvice(input: SavingsAdviceInput): SavingsAdvice {
  const { funds, month } = input;
  const needs = funds.map((fund) => ({
    fund,
    need: requiredThisMonth(fund, month),
    deposited: depositedInMonth(fund.deposits, month),
  }));
  const fundsNeed = needs.reduce((sum, n) => sum + n.need, 0);
  const required = Math.max(input.planSavings, fundsNeed);
  const deposited =
    needs.reduce((sum, n) => sum + n.deposited, 0) + (input.emergency?.depositedThisMonth ?? 0);
  const stillToSet = Math.max(0, required - deposited);
  const freeAfter = Math.max(0, input.freeBeforeSaving - Math.max(required, deposited));

  let left = stillToSet;
  const split: { id: string; amount: Minor }[] = [];
  const give = (id: string, cap: Minor) => {
    const amount = Math.min(left, Math.max(0, cap));
    if (amount > 0) {
      split.push({ id, amount });
      left -= amount;
    }
  };
  [...needs]
    // Pots without a date come last: nothing is due, so they only get what is left.
    .sort((a, b) => (a.fund.dueMonth ?? "9999-12").localeCompare(b.fund.dueMonth ?? "9999-12"))
    .forEach((n) => give(n.fund.id, n.need - n.deposited));
  // While the emergency fund is short, everything left goes to it: nothing is invested before it is full.
  const behind = input.emergency !== undefined && input.emergency.gap > 0;
  if (behind) give("emergency", left);
  // With the fund full, what no pot still needs goes to investing: it should not sit idle.
  if (left > 0) give("investing", left);

  const investingShare = behind ? 0 : Math.max(0, required - fundsNeed);

  return { required, deposited, stillToSet, freeAfter, investingShare, suggestedSplit: split };
}
