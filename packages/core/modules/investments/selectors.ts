import { roundHalfToEven, type Minor } from "../../kernel/money";
import { TradeSchema, type Holding, type Trade } from "./schema";

/** Quantities are floats; anything below this is rounding dust, not a unit. */
const EPSILON = 1e-9;
const clean = (quantity: number): number => (Math.abs(quantity) < EPSILON ? 0 : quantity);

interface Position {
  quantity: number;
  /** Cost of the units still held, as a float so nothing is rounded along the way. */
  cost: number;
  /** Profit already made on units sold. */
  realized: number;
  valid: boolean;
}

/** Replays the trades by date (average-cost method). `valid` is false if a sale ever exceeds the holding. */
function replay(trades: Trade[]): Position {
  const ordered = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  const position: Position = { quantity: 0, cost: 0, realized: 0, valid: true };
  for (const trade of ordered) {
    const fee = trade.fee ?? 0;
    if (trade.side === "buy") {
      position.quantity += trade.quantity;
      position.cost += trade.quantity * trade.unitPrice + fee;
    } else {
      if (trade.quantity > position.quantity + EPSILON) {
        position.valid = false;
        continue;
      }
      const average = position.quantity > 0 ? position.cost / position.quantity : 0;
      position.realized += trade.quantity * (trade.unitPrice - average) - fee;
      position.cost -= average * trade.quantity;
      position.quantity = clean(position.quantity - trade.quantity);
      if (position.quantity === 0) position.cost = 0;
    }
  }
  position.quantity = clean(position.quantity);
  return position;
}

export function holdingQuantity(holding: Holding): number {
  return replay(holding.trades).quantity;
}

/** Weighted average cost of one unit still held, fees included; null when nothing is held. */
export function averageCost(holding: Holding): Minor | null {
  const { quantity, cost } = replay(holding.trades);
  return quantity > 0 ? roundHalfToEven(cost / quantity) : null;
}

/** What the units still held cost. */
export function costBasis(holding: Holding): Minor {
  return roundHalfToEven(replay(holding.trades).cost);
}

/** Value at the price the user entered; at cost when no price was ever entered. */
export function marketValue(holding: Holding): { value: Minor; priceKnown: boolean } {
  if (holding.currentPrice === undefined) return { value: costBasis(holding), priceKnown: false };
  return {
    value: roundHalfToEven(holdingQuantity(holding) * holding.currentPrice),
    priceKnown: true,
  };
}

export function unrealizedPnL(holding: Holding): Minor {
  return marketValue(holding).value - costBasis(holding);
}

export function realizedPnL(holding: Holding): Minor {
  return roundHalfToEven(replay(holding.trades).realized);
}

export type TradeResult =
  | { ok: true; holding: Holding }
  | { ok: false; reason: "invalid" | "sell-exceeds-holding" | "not-found" };

export function addTrade(holding: Holding, trade: Trade): TradeResult {
  if (!TradeSchema.safeParse(trade).success) return { ok: false, reason: "invalid" };
  const trades = [...holding.trades, trade];
  if (!replay(trades).valid) return { ok: false, reason: "sell-exceeds-holding" };
  return { ok: true, holding: { ...holding, trades } };
}

/** Removes a trade, unless a later sale depends on it. */
export function removeTrade(holding: Holding, id: string): TradeResult {
  if (!holding.trades.some((t) => t.id === id)) return { ok: false, reason: "not-found" };
  const trades = holding.trades.filter((t) => t.id !== id);
  if (!replay(trades).valid) return { ok: false, reason: "sell-exceeds-holding" };
  return { ok: true, holding: { ...holding, trades } };
}

export interface PortfolioTotals {
  value: Minor;
  cost: Minor;
  profit: Minor;
}

export function portfolioTotals(holdings: Holding[]): PortfolioTotals {
  const value = holdings.reduce((sum, h) => sum + marketValue(h).value, 0);
  const cost = holdings.reduce((sum, h) => sum + costBasis(h), 0);
  return { value, cost, profit: value - cost };
}

export interface Allocation {
  /** A preset id, or "custom:<name>" for a type the user made. */
  key: string;
  value: Minor;
  share: number;
}

/** The portfolio's value by type, largest first. */
export function allocationByType(holdings: Holding[]): Allocation[] {
  const byKey = new Map<string, number>();
  for (const h of holdings) {
    const key = h.typeId === "custom" ? `custom:${h.customType ?? ""}` : h.typeId;
    byKey.set(key, (byKey.get(key) ?? 0) + marketValue(h).value);
  }
  const total = [...byKey.values()].reduce((sum, v) => sum + v, 0);
  return [...byKey.entries()]
    .map(([key, value]) => ({ key, value, share: total > 0 ? value / total : 0 }))
    .sort((a, b) => b.value - a.value);
}

/** A nominal return with inflation taken out: (1 + r) / (1 + i) - 1. */
export function realReturn(nominal: number, inflation: number): number {
  return (1 + nominal) / (1 + inflation) - 1;
}

/** Days since the price was entered; null if it never was. Both dates are YYYY-MM-DD. */
export function priceStaleDays(holding: Holding, today: string): number | null {
  if (!holding.priceDate) return null;
  const day = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  return Math.round((day(today) - day(holding.priceDate)) / 86_400_000);
}
