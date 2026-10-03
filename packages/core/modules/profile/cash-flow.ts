import type { Minor } from "../../kernel/money";
import type { Commitment } from "../../kernel/commitment";
import type { Month } from "../../kernel/month";
import { projectSeries } from "../../kernel/project";
import { activeFixedExpenses } from "./active-expenses";
import type { Profile } from "./schema";
import { netMonthlyIncome } from "./selectors";

export interface CashFlowPoint {
  month: Month;
  income: Minor;
  /** Recurring expenses still active that month. */
  obligations: Minor;
  living: Minor;
  /** What the user set aside for going out and shopping; zero when they set no amount. */
  personal: Minor;
  /** Installment payments due that month (from active commitments). */
  installments: Minor;
  /** Sinking-fund set-asides due that month. */
  setAside: Minor;
  /** income - obligations - living - personal - installments - set-asides; negative when the month is overspent. */
  left: Minor;
}

/**
 * Month-by-month cash flow for the dashboard. Derived on every call from the
 * profile and the ledger, never stored. Cash purchases are not part of it: they
 * are paid from the account by the user and never become commitments.
 */
export function cashFlowSeries(
  profile: Profile,
  commitments: Commitment[],
  months: Month[],
): CashFlowPoint[] {
  const income = netMonthlyIncome(profile);
  const projections = projectSeries({ income }, commitments, months);

  return projections.map((projection) => {
    const { month, installmentLoad: installments, sinkingSetAside: setAside } = projection;
    const obligations = activeFixedExpenses(profile, month).reduce((sum, e) => sum + e.monthly, 0);
    const personal = profile.personalSpending ?? 0;
    return {
      month,
      income,
      obligations,
      living: profile.livingExpenses,
      personal,
      installments,
      setAside,
      left: income - obligations - profile.livingExpenses - personal - installments - setAside,
    };
  });
}
