import {
  addTrade,
  holdingsInSlice,
  removeTrade,
  type BasketEntry,
  type Holding,
  type Month,
} from "@stoafi/core";

/** The id of the purchase a tick records, so ticking again or undoing finds it. */
export const basketTradeId = (month: Month, entryId: string): string =>
  `basket-${month}-${entryId}`;

/**
 * The holding a tick can record a purchase in: the only one in the slice, when its price is known so the
 * amount can be turned into a quantity. Anything else is only logged, never guessed.
 */
export function holdingForTick(
  holdings: Holding[],
  basket: BasketEntry[],
  entryId: string,
): Holding | null {
  const inSlice = holdingsInSlice(holdings, basket, entryId);
  const only = inSlice.length === 1 ? inSlice[0] : undefined;
  return only?.currentPrice && only.currentPrice > 0 ? only : null;
}

/** Records "I invested this" as a purchase at the holding's current price. Null when there is nothing to update. */
export function tickBasketSlice(input: {
  holdings: Holding[];
  basket: BasketEntry[];
  entryId: string;
  month: Month;
  date: string;
  amount: number;
}): Holding | null {
  const { holdings, basket, entryId, month, date, amount } = input;
  const target = holdingForTick(holdings, basket, entryId);
  if (!target || amount <= 0) return null;
  const id = basketTradeId(month, entryId);
  // Ticking twice replaces the earlier purchase rather than adding a second one.
  const cleared = removeTrade(target, id);
  const base = cleared.ok ? cleared.holding : target;
  const result = addTrade(base, {
    id,
    date,
    side: "buy",
    quantity: amount / (target.currentPrice as number), // checked non-zero in holdingForTick
    unitPrice: target.currentPrice as number,
    note: "basket",
  });
  return result.ok ? result.holding : null;
}

/** Takes back the purchase a tick recorded, wherever it ended up. Returns the holdings that changed. */
export function untickBasketSlice(holdings: Holding[], month: Month, entryId: string): Holding[] {
  const id = basketTradeId(month, entryId);
  return holdings.flatMap((h) => {
    const result = removeTrade(h, id);
    return result.ok ? [result.holding] : [];
  });
}
