import { describe, expect, it } from "vitest";
import type { BasketEntry } from "../../kernel/basket";
import { basketValues } from "./basket-values";
import type { Holding } from "./schema";

const holding = (id: string, typeId: string, quantity: number, basketId?: string): Holding => ({
  id,
  label: id,
  typeId,
  currentPrice: 1_000,
  ...(basketId ? { basketId } : {}),
  trades: [{ id: `${id}-t`, date: "2026-01-01", side: "buy", quantity, unitPrice: 1_000 }],
});

const entries: BasketEntry[] = [
  { id: "gold", label: "Gold", typeId: "gold", percent: 50 },
  { id: "sp", label: "S&P 500", typeId: "index-fund", percent: 30 },
  { id: "nasdaq", label: "Nasdaq", typeId: "index-fund", percent: 20 },
];

describe("basketValues", () => {
  it("counts a holding toward the only slice of its kind", () => {
    const { values, unassigned } = basketValues([holding("g", "gold", 3)], entries);
    expect(values.gold).toBe(3_000);
    expect(unassigned).toEqual([]);
  });

  it("uses the slice the user picked when two slices share a kind", () => {
    const { values } = basketValues([holding("i", "index-fund", 2, "nasdaq")], entries);
    expect(values.nasdaq).toBe(2_000);
    expect(values.sp).toBe(0);
  });

  it("leaves an ambiguous or unmatched holding unassigned instead of guessing", () => {
    const { values, unassigned } = basketValues(
      [holding("i", "index-fund", 2), holding("c", "crypto", 1)],
      entries,
    );
    expect(unassigned.map((h) => h.id)).toEqual(["i", "c"]);
    expect(Object.values(values).every((v) => v === 0)).toBe(true);
  });

  it("ignores a pick that points at a slice that was deleted", () => {
    const { unassigned } = basketValues([holding("x", "crypto", 1, "gone")], entries);
    expect(unassigned).toHaveLength(1);
  });

  it("starts every slice at zero", () => {
    expect(basketValues([], entries).values).toEqual({ gold: 0, sp: 0, nasdaq: 0 });
  });
});
