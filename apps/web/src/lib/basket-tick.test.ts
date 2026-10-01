import { describe, expect, it } from "vitest";
import type { BasketEntry, Holding } from "@stoafi/core";
import { basketTradeId, holdingForTick, tickBasketSlice, untickBasketSlice } from "./basket-tick";

const basket: BasketEntry[] = [
  { id: "gold", label: "Gold", typeId: "gold", percent: 60 },
  { id: "idx", label: "Index", typeId: "index-fund", percent: 40 },
];

const gold: Holding = {
  id: "g",
  label: "Gram gold",
  typeId: "gold",
  currentPrice: 300_000,
  trades: [{ id: "t0", date: "2026-01-01", side: "buy", quantity: 1, unitPrice: 200_000 }],
};

const args = {
  basket,
  entryId: "gold",
  month: "2026-10" as const,
  date: "2026-10-05",
  amount: 600_000,
};

describe("tickBasketSlice", () => {
  it("records the amount as a purchase at the current price", () => {
    const next = tickBasketSlice({ ...args, holdings: [gold] });
    const trade = next?.trades.find((t) => t.id === basketTradeId("2026-10", "gold"));
    expect(trade).toMatchObject({
      side: "buy",
      unitPrice: 300_000,
      quantity: 2,
      date: "2026-10-05",
    });
  });

  it("replaces an earlier tick instead of adding a second purchase", () => {
    const once = tickBasketSlice({ ...args, holdings: [gold] }) as Holding;
    const twice = tickBasketSlice({ ...args, amount: 300_000, holdings: [once] }) as Holding;
    expect(twice.trades.filter((t) => t.id === basketTradeId("2026-10", "gold"))).toHaveLength(1);
    expect(twice.trades.find((t) => t.id === basketTradeId("2026-10", "gold"))?.quantity).toBe(1);
  });

  it("only logs when there is no single priced holding to update", () => {
    expect(tickBasketSlice({ ...args, holdings: [] })).toBeNull();
    expect(
      tickBasketSlice({ ...args, holdings: [{ ...gold, currentPrice: undefined }] }),
    ).toBeNull();
    expect(tickBasketSlice({ ...args, holdings: [gold, { ...gold, id: "g2" }] })).toBeNull();
    expect(tickBasketSlice({ ...args, amount: 0, holdings: [gold] })).toBeNull();
  });

  it("does not guess between slices of the same kind", () => {
    const twoIdx: BasketEntry[] = [
      { id: "sp", label: "S&P", typeId: "index-fund", percent: 50 },
      { id: "nq", label: "Nasdaq", typeId: "index-fund", percent: 50 },
    ];
    const fund: Holding = { ...gold, id: "f", typeId: "index-fund" };
    expect(holdingForTick([fund], twoIdx, "sp")).toBeNull();
    expect(holdingForTick([{ ...fund, basketId: "nq" }], twoIdx, "nq")?.id).toBe("f");
  });
});

describe("untickBasketSlice", () => {
  it("takes back the purchase the tick made", () => {
    const ticked = tickBasketSlice({ ...args, holdings: [gold] }) as Holding;
    const [back] = untickBasketSlice([ticked], "2026-10", "gold");
    expect(back?.trades.map((t) => t.id)).toEqual(["t0"]);
  });

  it("changes nothing when the tick made no purchase", () => {
    expect(untickBasketSlice([gold], "2026-10", "gold")).toEqual([]);
  });
});
