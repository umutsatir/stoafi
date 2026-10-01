import type { Decision } from "./schema";

export interface SavingsSummary {
  totalSaved: number;
  count: number;
}

/** Total amount saved by skipped purchases, per SPEC's decision log acceptance criterion. */
export function savingsSummary(decisions: Decision[]): SavingsSummary {
  const skipped = decisions.filter((d) => d.outcome === "skipped");
  return {
    totalSaved: skipped.reduce((sum, d) => sum + d.amount, 0),
    count: skipped.length,
  };
}

/** A work day is eight hours of work; used to express money saved as time. */
export const WORK_HOURS_PER_DAY = 8;

export interface DecisionStats {
  saved: number;
  savedCount: number;
  bought: number;
  boughtCount: number;
  postponedCount: number;
  /** What the saving cost in work days; null when the hourly net income is unknown. */
  savedWorkDays: number | null;
}

/** Headline numbers for the decision log. `hourlyNetIncome` is in minor units per hour. */
export function decisionStats(
  decisions: Decision[],
  hourlyNetIncome: number | undefined,
): DecisionStats {
  const { totalSaved, count } = savingsSummary(decisions);
  const bought = decisions.filter((d) => d.outcome === "bought");
  return {
    saved: totalSaved,
    savedCount: count,
    bought: bought.reduce((sum, d) => sum + d.amount, 0),
    boughtCount: bought.length,
    postponedCount: decisions.filter((d) => d.outcome === "postponed").length,
    savedWorkDays:
      hourlyNetIncome && hourlyNetIncome > 0
        ? totalSaved / hourlyNetIncome / WORK_HOURS_PER_DAY
        : null,
  };
}

export function filterDecisions(
  decisions: Decision[],
  outcome: Decision["outcome"] | "all",
): Decision[] {
  return outcome === "all" ? decisions : decisions.filter((d) => d.outcome === outcome);
}

export interface DecisionMonthGroup {
  /** "2026-10", taken from the timestamp. */
  month: string;
  decisions: Decision[];
}

/** Decisions grouped by month, newest month first and newest decision first within it. */
export function groupDecisionsByMonth(decisions: Decision[]): DecisionMonthGroup[] {
  const sorted = [...decisions].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const groups: DecisionMonthGroup[] = [];
  for (const decision of sorted) {
    const month = decision.timestamp.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.decisions.push(decision);
    else groups.push({ month, decisions: [decision] });
  }
  return groups;
}
