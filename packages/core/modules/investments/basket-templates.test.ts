import { describe, expect, it } from "vitest";
import { isBasketComplete } from "../../kernel/basket";
import { BASKET_TEMPLATES, BASKET_TEMPLATES_AS_OF } from "./basket-templates";
import { INVESTMENT_TYPES } from "./types";

describe("example baskets", () => {
  it("each add up to exactly 100%", () => {
    for (const template of BASKET_TEMPLATES) {
      const entries = template.entries.map((e) => ({
        id: e.key,
        label: e.key,
        percent: e.percent,
      }));
      expect(isBasketComplete(entries), template.id).toBe(true);
    }
  });

  it("only use investment types that exist, and name their sources", () => {
    const types = new Set(INVESTMENT_TYPES.map((t) => t.id));
    for (const template of BASKET_TEMPLATES) {
      expect(template.sources.length, template.id).toBeGreaterThan(0);
      for (const entry of template.entries) expect(types.has(entry.typeId), entry.key).toBe(true);
    }
  });

  it("have unique slice keys within a basket", () => {
    for (const template of BASKET_TEMPLATES) {
      const keys = template.entries.map((e) => e.key);
      expect(new Set(keys).size, template.id).toBe(keys.length);
    }
  });

  it("carry a review date", () => {
    expect(BASKET_TEMPLATES_AS_OF).toMatch(/^\d{4}-\d{2}$/);
  });
});
