import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  basketDrift,
  basketTotal,
  catchUpSplit,
  isBasketComplete,
  splitByBasket,
  type BasketEntry,
} from "./basket";

const entry = (id: string, percent: number): BasketEntry => ({ id, label: id, percent });
const mixed = [entry("gold", 50), entry("sp", 30), entry("bond", 20)];
const sum = (parts: { amount: number }[]) => parts.reduce((a, p) => a + p.amount, 0);

describe("basket totals", () => {
  it("is complete only at exactly 100%", () => {
    expect(basketTotal(mixed)).toBe(100);
    expect(isBasketComplete(mixed)).toBe(true);
    expect(isBasketComplete([entry("a", 99)])).toBe(false);
    expect(isBasketComplete([entry("a", 60), entry("b", 50)])).toBe(false);
    expect(isBasketComplete([])).toBe(false);
  });
});

describe("splitByBasket", () => {
  it("splits by percent", () => {
    expect(splitByBasket(1_000_000, mixed).map((p) => p.amount)).toEqual([
      500_000, 300_000, 200_000,
    ]);
  });

  it("gives the leftover kuruş to the largest fractions so nothing is lost", () => {
    const thirds = [entry("a", 33), entry("b", 33), entry("c", 34)];
    const parts = splitByBasket(100, thirds).map((p) => p.amount);
    expect(parts).toEqual([33, 33, 34]);
    expect(splitByBasket(1, thirds).map((p) => p.amount)).toEqual([0, 0, 1]);
  });

  it("handles zero, one kuruş and a basket with no weight", () => {
    expect(sum(splitByBasket(0, mixed))).toBe(0);
    expect(sum(splitByBasket(1, mixed))).toBe(1);
    expect(sum(splitByBasket(500, [entry("a", 0)]))).toBe(0);
    expect(splitByBasket(500, [])).toEqual([]);
  });

  it("never gives anything to an entry at 0%", () => {
    const parts = splitByBasket(999, [entry("a", 0), entry("b", 100)]);
    expect(parts[0]?.amount).toBe(0);
  });

  it("always adds up to the amount for any amount and any weights", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000_000_000 }),
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 8 }),
        (amount, percents) => {
          const entries = percents.map((p, i) => entry(`e${i}`, p));
          const total = sum(splitByBasket(amount, entries));
          return basketTotal(entries) === 0 ? total === 0 : total === amount;
        },
      ),
    );
  });
});

describe("catchUpSplit", () => {
  it("sends new money to what is under its target first", () => {
    // Held: gold 700k, sp 300k. Targets 50/30/20. Adding 500k makes 1.5M: targets 750k/450k/300k.
    const parts = catchUpSplit(500_000, mixed, { gold: 700_000, sp: 300_000, bond: 0 });
    const by = Object.fromEntries(parts.map((p) => [p.id, p.amount]));
    expect(by.gold).toBe(50_000);
    expect(by.bond).toBeGreaterThan(by.sp ?? 0);
    expect(sum(parts)).toBe(500_000);
  });

  it("never sells: an entry far over target just gets nothing", () => {
    const parts = catchUpSplit(100_000, mixed, { gold: 5_000_000, sp: 0, bond: 0 });
    expect(parts.find((p) => p.id === "gold")?.amount).toBe(0);
    expect(sum(parts)).toBe(100_000);
  });

  it("falls back to the plain split when nothing is held yet", () => {
    expect(catchUpSplit(1_000_000, mixed, {})).toEqual(splitByBasket(1_000_000, mixed));
  });

  it("always adds up to the amount", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.array(fc.integer({ min: 0, max: 100_000_000 }), { minLength: 3, maxLength: 3 }),
        (amount, held) => {
          const values = { gold: held[0] ?? 0, sp: held[1] ?? 0, bond: held[2] ?? 0 };
          return sum(catchUpSplit(amount, mixed, values)) === amount;
        },
      ),
    );
  });
});

describe("basketDrift", () => {
  it("compares the share held with the target", () => {
    const drift = basketDrift(mixed, { gold: 600_000, sp: 300_000, bond: 100_000 });
    expect(drift.find((d) => d.id === "gold")).toMatchObject({
      currentPercent: 60,
      targetPercent: 50,
      difference: 10,
    });
    expect(drift.find((d) => d.id === "bond")?.difference).toBe(-10);
  });

  it("shows no difference when nothing is held", () => {
    const drift = basketDrift(mixed, {});
    expect(drift.every((d) => d.currentPercent === 0 && d.difference === 0)).toBe(true);
  });

  it("reads targets as shares when the basket does not add up to 100", () => {
    const drift = basketDrift([entry("a", 30), entry("b", 30)], { a: 50, b: 50 });
    expect(drift.map((d) => d.targetPercent)).toEqual([50, 50]);
    expect(drift.map((d) => d.difference)).toEqual([0, 0]);
  });
});
