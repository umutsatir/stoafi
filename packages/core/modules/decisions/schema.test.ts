import { describe, expect, it } from "vitest";
import { DecisionSchema } from "./schema";

const base = {
  id: "d1",
  queueItemRef: "item-1",
  timestamp: "2026-09-20T10:00:00.000Z",
  amount: 5000,
};

describe("DecisionSchema", () => {
  it.each(["bought", "postponed", "skipped"] as const)("parses outcome=%s", (outcome) => {
    const result = DecisionSchema.safeParse({ ...base, outcome });
    expect(result.success).toBe(true);
  });

  it("keeps the item name recorded at decision time", () => {
    const result = DecisionSchema.safeParse({
      ...base,
      outcome: "skipped",
      itemName: "Headphones",
    });
    expect(result.success && result.data.itemName).toBe("Headphones");
  });

  it("rejects an unknown outcome", () => {
    const result = DecisionSchema.safeParse({ ...base, outcome: "ignored" });
    expect(result.success).toBe(false);
  });

  it("requires guardBreachConfirmed=true when breachedRuleIds is non-empty", () => {
    const withoutConfirm = DecisionSchema.safeParse({
      ...base,
      outcome: "bought",
      breachedRuleIds: ["installment-cap"],
    });
    expect(withoutConfirm.success).toBe(false);

    const withConfirm = DecisionSchema.safeParse({
      ...base,
      outcome: "bought",
      breachedRuleIds: ["installment-cap"],
      guardBreachConfirmed: true,
    });
    expect(withConfirm.success).toBe(true);
  });

  it("does not require guardBreachConfirmed when there is no breach", () => {
    const result = DecisionSchema.safeParse({ ...base, outcome: "skipped" });
    expect(result.success).toBe(true);
  });
});
