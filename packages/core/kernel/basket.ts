import { z } from "zod";
import type { Minor } from "./money";
import { MonthSchema, type Month } from "./month";

/** One slice of the user's investing basket: a name and the share of new money it should get. */
export const BasketEntrySchema = z.object({
  id: z.string(),
  label: z.string(),
  /** The kind of investment this slice is (an investment type id), when it came from an example basket. */
  typeId: z.string().optional(),
  /** Whole percent, 0 to 100. */
  percent: z.number().int().min(0).max(100),
});

export type BasketEntry = z.infer<typeof BasketEntrySchema>;

/** Sum of the entries' percents; a finished basket adds up to 100. */
export function basketTotal(entries: BasketEntry[]): number {
  return entries.reduce((sum, e) => sum + e.percent, 0);
}

export function isBasketComplete(entries: BasketEntry[]): boolean {
  return entries.length > 0 && basketTotal(entries) === 100;
}

/**
 * Shares `amount` out by `weights` so the parts are whole minor units that add up to exactly `amount`:
 * each gets its floor, and the leftover units go to the largest fractions (earlier entry wins a tie).
 * Weights are only ratios; all-zero weights give everyone zero.
 */
function apportion(amount: Minor, weights: number[]): Minor[] {
  const total = weights.reduce((a, b) => a + b, 0);
  if (amount <= 0 || total <= 0) return weights.map(() => 0);
  const exact = weights.map((w) => (amount * w) / total);
  const parts = exact.map(Math.floor);
  let left = amount - parts.reduce((a, b) => a + b, 0);
  const order = exact
    .map((x, i) => ({ i, fraction: x - Math.floor(x) }))
    .sort((a, b) => b.fraction - a.fraction || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    parts[i] = (parts[i] ?? 0) + 1;
    left -= 1;
  }
  return parts;
}

export interface BasketShare {
  id: string;
  amount: Minor;
}

/** Splits a monthly amount by the basket's percents. Entries at 0% get nothing. */
export function splitByBasket(amount: Minor, entries: BasketEntry[]): BasketShare[] {
  const parts = apportion(
    amount,
    entries.map((e) => e.percent),
  );
  return entries.map((e, i) => ({ id: e.id, amount: parts[i] ?? 0 }));
}

/**
 * Splits new money so it moves the basket toward its targets: what is under its target gets the money
 * first, in proportion to how far under it is. When nothing is under (or no value is known yet) it falls
 * back to the plain percent split. Nothing is ever sold.
 */
export function catchUpSplit(
  amount: Minor,
  entries: BasketEntry[],
  currentValues: Record<string, Minor>,
): BasketShare[] {
  const total = basketTotal(entries);
  if (total <= 0) return entries.map((e) => ({ id: e.id, amount: 0 }));
  const current = entries.map((e) => currentValues[e.id] ?? 0);
  const afterTotal = current.reduce((a, b) => a + b, 0) + amount;
  const gaps = entries.map((e, i) =>
    Math.max(0, (afterTotal * e.percent) / total - (current[i] ?? 0)),
  );
  const gapSum = gaps.reduce((a, b) => a + b, 0);
  if (gapSum <= 0) return splitByBasket(amount, entries);

  // The gaps always add up to at least `amount` when something is under target, so share by gap.
  const parts = apportion(amount, gaps);
  return entries.map((e, i) => ({ id: e.id, amount: parts[i] ?? 0 }));
}

export interface BasketDrift {
  id: string;
  targetPercent: number;
  currentValue: Minor;
  /** Share of the basket's current value, in percent with one decimal; 0 when nothing is held. */
  currentPercent: number;
  /** currentPercent minus the target, in percentage points. */
  difference: number;
}

/** How far what the user holds is from the basket: per entry, current share against its target. */
export function basketDrift(
  entries: BasketEntry[],
  currentValues: Record<string, Minor>,
): BasketDrift[] {
  const total = entries.reduce((sum, e) => sum + (currentValues[e.id] ?? 0), 0);
  const targetTotal = basketTotal(entries);
  return entries.map((e) => {
    const currentValue = currentValues[e.id] ?? 0;
    const currentPercent = total > 0 ? Math.round((currentValue / total) * 1000) / 10 : 0;
    const targetPercent = targetTotal > 0 ? (e.percent / targetTotal) * 100 : 0;
    return {
      id: e.id,
      targetPercent: Math.round(targetPercent * 10) / 10,
      currentValue,
      currentPercent,
      difference: total > 0 ? Math.round((currentPercent - targetPercent) * 10) / 10 : 0,
    };
  });
}

/** "I put this month's share into this slice": what was invested, ticked off without typing a figure. */
export const BasketLogEntrySchema = z.object({
  month: MonthSchema,
  entryId: z.string(),
  amount: z.number().int().nonnegative(),
});

export type BasketLogEntry = z.infer<typeof BasketLogEntrySchema>;

export function basketDone(
  log: BasketLogEntry[],
  month: Month,
  entryId: string,
): BasketLogEntry | undefined {
  return log.find((l) => l.month === month && l.entryId === entryId);
}

/** Marks a slice done for a month; ticking it again replaces the earlier entry instead of doubling it. */
export function markBasketDone(log: BasketLogEntry[], entry: BasketLogEntry): BasketLogEntry[] {
  return [...unmarkBasketDone(log, entry.month, entry.entryId), entry];
}

export function unmarkBasketDone(
  log: BasketLogEntry[],
  month: Month,
  entryId: string,
): BasketLogEntry[] {
  return log.filter((l) => !(l.month === month && l.entryId === entryId));
}

/** Everything ticked off for a month. */
export function basketInvestedIn(log: BasketLogEntry[], month: Month): Minor {
  return log.filter((l) => l.month === month).reduce((sum, l) => sum + l.amount, 0);
}
