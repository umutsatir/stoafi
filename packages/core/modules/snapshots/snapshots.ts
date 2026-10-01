import { z } from "zod";
import type { Minor } from "../../kernel/money";
import { MonthSchema, type Month } from "../../kernel/month";

/**
 * One month's headline numbers, kept so trends can be drawn later. The live projection is never
 * stored (it is always recomputed); a snapshot is a deliberate record of how a month looked.
 */
export const SnapshotSchema = z.object({
  /** The month, so each month has exactly one snapshot. */
  id: z.string(),
  month: MonthSchema,
  income: z.number().int(),
  left: z.number().int(),
  savingsRate: z.number(),
  installmentRatio: z.number(),
  emergencyMonths: z.number(),
  runwayMonths: z.number(),
  /** Savings plus pots plus the value of investments. */
  wealth: z.number().int(),
});

export type Snapshot = z.infer<typeof SnapshotSchema>;
export type SnapshotKey = Exclude<keyof Snapshot, "id" | "month">;

export interface SnapshotInput {
  month: Month;
  income: Minor;
  left: Minor;
  savingsRate: number;
  installmentRatio: number;
  emergencyMonths: number;
  runwayMonths: number;
  savings: Minor;
  potsTotal: Minor;
  portfolioValue: Minor;
}

/** Ratios and months are rounded to 4 and 2 places so float noise never reads as a change. */
const round = (value: number, places: number): number => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

export function buildSnapshot(input: SnapshotInput): Snapshot {
  return {
    id: input.month,
    month: input.month,
    income: input.income,
    left: input.left,
    savingsRate: round(input.savingsRate, 4),
    installmentRatio: round(input.installmentRatio, 4),
    emergencyMonths: round(input.emergencyMonths, 2),
    runwayMonths: round(input.runwayMonths, 2),
    wealth: input.savings + input.potsTotal + input.portfolioValue,
  };
}

/** The list with this month's snapshot added or replaced, in date order. Returns a new list. */
export function upsertSnapshot(list: Snapshot[], snapshot: Snapshot): Snapshot[] {
  return [...list.filter((s) => s.month !== snapshot.month), snapshot].sort((a, b) =>
    a.month.localeCompare(b.month),
  );
}

export function sameSnapshot(a: Snapshot | undefined, b: Snapshot): boolean {
  if (!a) return false;
  return (
    a.income === b.income &&
    a.left === b.left &&
    a.savingsRate === b.savingsRate &&
    a.installmentRatio === b.installmentRatio &&
    a.emergencyMonths === b.emergencyMonths &&
    a.runwayMonths === b.runwayMonths &&
    a.wealth === b.wealth
  );
}

export interface Trend {
  /** The last `months` values, oldest first. */
  points: number[];
  /** Latest value minus the one before it; null with fewer than two months. */
  change: number | null;
}

export function trendOf(list: Snapshot[], key: SnapshotKey, months: number): Trend {
  const points = [...list]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-months)
    .map((s) => s[key]);
  const last = points[points.length - 1];
  const before = points[points.length - 2];
  return { points, change: last !== undefined && before !== undefined ? last - before : null };
}
