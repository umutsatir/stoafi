import { describe, expect, it } from "vitest";
import {
  limitUsage,
  mainCards,
  removeCardFromSet,
  supplementariesOf,
  validateCardSet,
} from "./card-set";
import type { Card } from "./schema";

const main: Card = {
  id: "m",
  label: "Bonus",
  statementDay: 15,
  dueDay: 5,
  kind: "main",
  limit: 5_000_000,
  currentDebt: 1_000_000,
};
const spouse: Card = {
  id: "s1",
  label: "Spouse",
  statementDay: 20,
  dueDay: 10,
  kind: "supplementary",
  parentId: "m",
  currentDebt: 500_000,
};
const kid: Card = { ...spouse, id: "s2", label: "Kid", currentDebt: undefined };
const other: Card = { id: "o", label: "Other", statementDay: 1, dueDay: 25 };

describe("card tree", () => {
  it("treats a card without a kind as a main card", () => {
    expect(mainCards([main, spouse, other]).map((c) => c.id)).toEqual(["m", "o"]);
  });

  it("lists the supplementary cards of a main card in stored order", () => {
    expect(supplementariesOf([main, spouse, other, kid], "m").map((c) => c.id)).toEqual([
      "s1",
      "s2",
    ]);
    expect(supplementariesOf([main, spouse, other], "o")).toEqual([]);
  });
});

describe("validateCardSet", () => {
  it("accepts a consistent set", () => {
    expect(validateCardSet([main, spouse, kid, other])).toEqual([]);
  });

  it("flags a supplementary card whose parent is missing or is itself supplementary", () => {
    const orphan: Card = { ...spouse, parentId: "gone" };
    const nested: Card = { ...kid, parentId: "s1" };
    expect(validateCardSet([main, orphan])).toEqual([{ cardId: "s1", problem: "missing-parent" }]);
    expect(validateCardSet([main, spouse, nested])).toEqual([
      { cardId: "s2", problem: "nested-supplementary" },
    ]);
  });

  it("flags duplicate ids", () => {
    expect(validateCardSet([main, { ...other, id: "m" }])).toEqual([
      { cardId: "m", problem: "duplicate-id" },
    ]);
  });
});

describe("limitUsage", () => {
  it("adds the main card's and its supplementary cards' debt and installments to one shared limit", () => {
    const usage = limitUsage([main, spouse, kid], "m", { m: 300_000, s1: 200_000 });
    expect(usage).toEqual({
      limit: 5_000_000,
      used: 1_000_000 + 500_000 + 300_000 + 200_000,
      available: 5_000_000 - 2_000_000,
      overLimit: false,
      byCard: { m: 1_300_000, s1: 700_000, s2: 0 },
    });
  });

  it("reports no available limit and flags it when the card is over its limit", () => {
    const usage = limitUsage([main, spouse], "m", { m: 4_000_000 });
    expect(usage?.available).toBe(0);
    expect(usage?.overLimit).toBe(true);
    expect(usage?.used).toBe(5_500_000);
  });

  it("treats a missing limit as unknown, not zero", () => {
    expect(limitUsage([other], "o", {})).toBeNull();
  });

  it("handles a zero limit and nothing owed", () => {
    const zero: Card = { ...main, limit: 0, currentDebt: undefined };
    expect(limitUsage([zero], "m", {})).toMatchObject({ available: 0, used: 0, overLimit: false });
  });

  it("returns null for a supplementary or unknown card id", () => {
    expect(limitUsage([main, spouse], "s1", {})).toBeNull();
    expect(limitUsage([main], "nope", {})).toBeNull();
  });

  it("ignores installments of unrelated cards", () => {
    const usage = limitUsage([main, other], "m", { o: 9_999_999 });
    expect(usage?.used).toBe(1_000_000);
  });
});

describe("removeCardFromSet", () => {
  it("removes a supplementary card on its own", () => {
    const result = removeCardFromSet([main, spouse, kid], "s1", { supplementary: "delete" });
    expect(result).toEqual({ ok: true, cards: [main, kid], removedIds: ["s1"] });
  });

  it("removes a main card together with its supplementary cards", () => {
    const result = removeCardFromSet([main, spouse, kid, other], "m", { supplementary: "delete" });
    expect(result).toEqual({ ok: true, cards: [other], removedIds: ["m", "s1", "s2"] });
  });

  it("turns the supplementary cards into main cards with their own limit when asked to keep them", () => {
    const result = removeCardFromSet([main, spouse, kid], "m", {
      supplementary: "detach",
      limits: { s1: 2_000_000, s2: 1_000_000 },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.removedIds).toEqual(["m"]);
    expect(result.cards).toEqual([
      { ...spouse, kind: "main", parentId: undefined, limit: 2_000_000 },
      { ...kid, kind: "main", parentId: undefined, limit: 1_000_000 },
    ]);
  });

  it("refuses to detach without a limit for every supplementary card", () => {
    const result = removeCardFromSet([main, spouse, kid], "m", {
      supplementary: "detach",
      limits: { s1: 2_000_000 },
    });
    expect(result).toEqual({ ok: false, missingLimitFor: ["s2"] });
  });

  it("leaves the set alone for an unknown id", () => {
    expect(removeCardFromSet([main], "nope", { supplementary: "delete" })).toEqual({
      ok: true,
      cards: [main],
      removedIds: [],
    });
  });

  it("removes a main card with no supplementary cards whatever the option", () => {
    expect(removeCardFromSet([main, other], "o", { supplementary: "detach", limits: {} })).toEqual({
      ok: true,
      cards: [main],
      removedIds: ["o"],
    });
  });
});
