import { describe, expect, it } from "vitest";
import {
  addTrade,
  allocationByType,
  averageCost,
  costBasis,
  holdingQuantity,
  marketValue,
  portfolioTotals,
  priceStaleDays,
  realReturn,
  realizedPnL,
  removeTrade,
  unrealizedPnL,
} from "./selectors";
import { HoldingSchema, type Holding, type Trade } from "./schema";
import { INVESTMENT_TYPES, investmentType } from "./types";

const trade = (over: Partial<Trade> & { id: string }): Trade => ({
  date: "2026-01-10",
  side: "buy",
  quantity: 1,
  unitPrice: 100_000,
  ...over,
});
const holding = (trades: Trade[], over: Partial<Holding> = {}): Holding => ({
  id: "h",
  label: "Gram gold",
  typeId: "gold",
  trades,
  ...over,
});

describe("HoldingSchema", () => {
  it("accepts a holding with decimal quantities and integer money", () => {
    const parsed = HoldingSchema.safeParse(
      holding([trade({ id: "a", quantity: 0.35, unitPrice: 245_000, fee: 50 })], {
        currentPrice: 250_000,
        priceDate: "2026-10-01",
        unitLabel: "g",
      }),
    );
    expect(parsed.success).toBe(true);
  });

  it("rejects a zero or negative quantity, a fractional price and a bad date", () => {
    for (const bad of [
      trade({ id: "a", quantity: 0 }),
      trade({ id: "a", quantity: -1 }),
      trade({ id: "a", unitPrice: 10.5 }),
      trade({ id: "a", unitPrice: -1 }),
      trade({ id: "a", date: "10.01.2026" }),
      trade({ id: "a", fee: -1 }),
    ]) {
      expect(HoldingSchema.safeParse(holding([bad])).success).toBe(false);
    }
  });

  it("keeps a custom type's name", () => {
    expect(
      HoldingSchema.safeParse(holding([], { typeId: "custom", customType: "Wine" })).success,
    ).toBe(true);
  });
});

describe("investment types", () => {
  it("has the preset types with unique ids and falls back to other", () => {
    const ids = INVESTMENT_TYPES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(["gold", "stock", "fund", "index-fund", "other"]));
    expect(investmentType("gold").icon).toBe("gold");
    expect(investmentType("nope").id).toBe("other");
  });
});

describe("quantity, cost and value", () => {
  const h = holding([
    trade({ id: "a", quantity: 2, unitPrice: 100_000 }),
    trade({ id: "b", quantity: 2, unitPrice: 200_000, date: "2026-02-10" }),
  ]);

  it("adds buys and subtracts sells", () => {
    expect(holdingQuantity(h)).toBe(4);
    expect(
      holdingQuantity({
        ...h,
        trades: [...h.trades, trade({ id: "s", side: "sell", quantity: 1.5, date: "2026-03-01" })],
      }),
    ).toBe(2.5);
  });

  it("uses the weighted average cost, fees included", () => {
    expect(averageCost(h)).toBe(150_000);
    const withFee = holding([trade({ id: "a", quantity: 2, unitPrice: 100_000, fee: 1_000 })]);
    expect(averageCost(withFee)).toBe(100_500);
    expect(costBasis(withFee)).toBe(201_000);
  });

  it("keeps the average cost of what is left after a sell", () => {
    const sold = {
      ...h,
      trades: [
        ...h.trades,
        trade({ id: "s", side: "sell", quantity: 3, unitPrice: 300_000, date: "2026-03-01" }),
      ],
    };
    expect(averageCost(sold)).toBe(150_000);
    expect(costBasis(sold)).toBe(150_000);
  });

  it("values at the price the user entered, or at cost when there is no price", () => {
    expect(marketValue({ ...h, currentPrice: 250_000 })).toEqual({
      value: 1_000_000,
      priceKnown: true,
    });
    expect(marketValue(h)).toEqual({ value: 600_000, priceKnown: false });
  });

  it("rounds a fractional quantity times price once, half to even", () => {
    // 0.35 * 250,001 = 87,500.35 -> 87,500
    const g = holding([trade({ id: "a", quantity: 0.35, unitPrice: 250_001 })], {
      currentPrice: 250_001,
    });
    expect(marketValue(g).value).toBe(87_500);
    // 0.5 * 3 = 1.5 -> 2 (even)
    expect(
      marketValue(holding([trade({ id: "a", quantity: 0.5, unitPrice: 3 })], { currentPrice: 3 }))
        .value,
    ).toBe(2);
  });

  it("has no average cost, zero value and zero cost for an empty holding", () => {
    const empty = holding([]);
    expect(holdingQuantity(empty)).toBe(0);
    expect(averageCost(empty)).toBeNull();
    expect(costBasis(empty)).toBe(0);
    expect(marketValue(empty).value).toBe(0);
  });

  it("treats a holding sold down to nothing as empty, despite float dust", () => {
    const g = holding([
      trade({ id: "a", quantity: 0.1 }),
      trade({ id: "b", quantity: 0.2 }),
      trade({ id: "s", side: "sell", quantity: 0.3 }),
    ]);
    expect(holdingQuantity(g)).toBe(0);
  });
});

describe("profit and loss", () => {
  const h = holding(
    [
      trade({ id: "a", quantity: 4, unitPrice: 100_000 }),
      trade({ id: "s", side: "sell", quantity: 1, unitPrice: 150_000, fee: 500 }),
    ],
    { currentPrice: 120_000 },
  );

  it("realized profit is the sale minus the average cost and the fee", () => {
    // 150,000 - 100,000 - 500 = 49,500
    expect(realizedPnL(h)).toBe(49_500);
  });

  it("unrealized profit is value minus cost of what is still held", () => {
    // 3 * 120,000 - 3 * 100,000
    expect(unrealizedPnL(h)).toBe(60_000);
  });

  it("is zero without a price, because value falls back to cost", () => {
    expect(unrealizedPnL({ ...h, currentPrice: undefined })).toBe(0);
  });

  it("can be a loss", () => {
    const loss = holding([trade({ id: "a", quantity: 2, unitPrice: 100_000 })], {
      currentPrice: 80_000,
    });
    expect(unrealizedPnL(loss)).toBe(-40_000);
  });
});

describe("addTrade and removeTrade", () => {
  const h = holding([trade({ id: "a", quantity: 2 })]);

  it("adds a buy", () => {
    const result = addTrade(h, trade({ id: "b", quantity: 1 }));
    expect(result.ok && holdingQuantity(result.holding)).toBe(3);
  });

  it("refuses to sell more than is held, and sells everything exactly", () => {
    expect(addTrade(h, trade({ id: "s", side: "sell", quantity: 2.01 }))).toEqual({
      ok: false,
      reason: "sell-exceeds-holding",
    });
    const all = addTrade(h, trade({ id: "s", side: "sell", quantity: 2 }));
    expect(all.ok && holdingQuantity(all.holding)).toBe(0);
  });

  it("refuses an invalid trade", () => {
    expect(addTrade(h, trade({ id: "b", quantity: 0 }))).toEqual({ ok: false, reason: "invalid" });
  });

  it("removes a trade, but not one that later sells depend on", () => {
    const withSell = holding([
      trade({ id: "a", quantity: 2 }),
      trade({ id: "s", side: "sell", quantity: 2, date: "2026-03-01" }),
    ]);
    expect(removeTrade(withSell, "a")).toEqual({ ok: false, reason: "sell-exceeds-holding" });
    const removed = removeTrade(withSell, "s");
    expect(removed.ok && holdingQuantity(removed.holding)).toBe(2);
    expect(removeTrade(h, "zzz")).toEqual({ ok: false, reason: "not-found" });
  });
});

describe("portfolio", () => {
  const gold = holding([trade({ id: "a", quantity: 2, unitPrice: 100_000 })], {
    id: "g",
    currentPrice: 150_000,
  });
  const stock = holding([trade({ id: "b", quantity: 10, unitPrice: 10_000 })], {
    id: "s",
    typeId: "stock",
    label: "Fund",
    currentPrice: 20_000,
  });
  const wine = holding([trade({ id: "c", quantity: 1, unitPrice: 50_000 })], {
    id: "w",
    typeId: "custom",
    customType: "Wine",
    label: "Case",
  });

  it("totals value, cost and profit", () => {
    expect(portfolioTotals([gold, stock, wine])).toEqual({
      value: 300_000 + 200_000 + 50_000,
      cost: 200_000 + 100_000 + 50_000,
      profit: 200_000,
    });
  });

  it("splits the value by type, custom types by their own name, largest first", () => {
    const split = allocationByType([gold, stock, wine]);
    expect(split.map((s) => s.key)).toEqual(["gold", "stock", "custom:Wine"]);
    expect(split[0]?.value).toBe(300_000);
    expect(split.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1, 10);
  });

  it("is empty for no holdings", () => {
    expect(portfolioTotals([])).toEqual({ value: 0, cost: 0, profit: 0 });
    expect(allocationByType([])).toEqual([]);
  });
});

describe("real return and price age", () => {
  it("takes inflation out of a nominal return", () => {
    expect(realReturn(0.5, 0.25)).toBeCloseTo(0.2, 10);
    expect(realReturn(0.1, 0.1)).toBeCloseTo(0, 10);
    expect(realReturn(0, 0.3)).toBeCloseTo(-0.2308, 3);
  });

  it("counts the days since the price was entered, null when never", () => {
    expect(priceStaleDays(holding([], { priceDate: "2026-09-01" }), "2026-10-01")).toBe(30);
    expect(priceStaleDays(holding([], { priceDate: "2026-10-01" }), "2026-10-01")).toBe(0);
    expect(priceStaleDays(holding([]), "2026-10-01")).toBeNull();
  });
});
