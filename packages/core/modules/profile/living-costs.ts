import bands from "../../data/living-cost-bands.json";
import { roundHalfToEven, type Minor } from "../../kernel/money";

export type LivingBand = "comfortable" | "typical" | "high" | "veryHigh";
export type InflationComparison = "below" | "near" | "above";

export interface LivingCostCheck {
  /** Share of income, 0 to 1+; null when there is no income to compare with. */
  share: number | null;
  band: LivingBand | null;
  /** The same costs a year on at the expected inflation, and how much more that is a month. */
  nextYear: Minor;
  increase: Minor;
  /** The user's own price rise since a year ago, when they said what it was then. */
  ownRise: number | null;
  /** Their own rise against the expected inflation (within the tolerance counts as near). */
  versusExpected: InflationComparison | null;
}

export interface LivingCostInput {
  living: Minor;
  income: Minor;
  /** Expected yearly inflation as a fraction (0.38 for 38%). */
  annualInflation: number;
  /** What living costs were about a year ago, in minor units. */
  yearAgo?: Minor;
}

/**
 * Where monthly living costs (groceries and household bills) stand: their share of income against rule-of-
 * thumb bands, what they become after a year of expected inflation, and, if the user knows what they were a
 * year ago, whether their own costs rose faster or slower than expected.
 */
export function livingCostCheck(input: LivingCostInput): LivingCostCheck {
  const { living, income, annualInflation, yearAgo } = input;
  const share = income > 0 ? living / income : null;
  const limits = bands.shareOfIncome;
  const band: LivingBand | null =
    share === null
      ? null
      : share <= limits.comfortable
        ? "comfortable"
        : share <= limits.typical
          ? "typical"
          : share <= limits.high
            ? "high"
            : "veryHigh";

  const nextYear = roundHalfToEven(living * (1 + annualInflation));
  const ownRise = yearAgo !== undefined && yearAgo > 0 ? living / yearAgo - 1 : null;
  const versusExpected: InflationComparison | null =
    ownRise === null
      ? null
      : ownRise > annualInflation + bands.inflationTolerance
        ? "above"
        : ownRise < annualInflation - bands.inflationTolerance
          ? "below"
          : "near";

  return { share, band, nextYear, increase: nextYear - living, ownRise, versusExpected };
}
