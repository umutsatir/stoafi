import rules from "../../data/queue-rules.json";

/** After this many days a queue item's price is worth checking again. */
export const PRICE_STALE_DAYS: number = rules.priceStaleDays;

const day = (iso: string): number =>
  Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000;

/** Days since the price was last set, never negative. `today` is passed in. */
export function priceAgeDays(item: { priceUpdatedDate: string }, today: string): number {
  return Math.max(0, Math.round(day(today) - day(item.priceUpdatedDate)));
}

export function priceIsStale(
  item: { priceUpdatedDate: string },
  today: string,
  thresholdDays: number = PRICE_STALE_DAYS,
): boolean {
  return priceAgeDays(item, today) >= thresholdDays;
}
