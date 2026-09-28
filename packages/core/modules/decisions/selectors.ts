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
