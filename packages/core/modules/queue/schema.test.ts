import { describe, expect, it } from "vitest";
import { QueueItemSchema } from "./schema";

const base = {
  id: "item-1",
  name: "New laptop",
  price: 500000,
  urgency: 2,
  importance: 2,
  isNeed: false,
  expectedUses: 1000,
  addedDate: "2026-09-01",
  priceUpdatedDate: "2026-09-01",
  order: 0,
};

describe("QueueItemSchema", () => {
  it("parses a minimal valid item with no installment offers", () => {
    const result = QueueItemSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects urgency outside 1-3", () => {
    expect(QueueItemSchema.safeParse({ ...base, urgency: 0 }).success).toBe(false);
    expect(QueueItemSchema.safeParse({ ...base, urgency: 4 }).success).toBe(false);
  });

  it("rejects importance outside 1-3", () => {
    expect(QueueItemSchema.safeParse({ ...base, importance: 0 }).success).toBe(false);
    expect(QueueItemSchema.safeParse({ ...base, importance: 4 }).success).toBe(false);
  });

  it("accepts installmentOffers reusing the installments schema", () => {
    const result = QueueItemSchema.safeParse({
      ...base,
      installmentOffers: [{ months: 3, payments: [180000, 180000, 180000] }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid installment offer", () => {
    const result = QueueItemSchema.safeParse({
      ...base,
      installmentOffers: [{ months: 0, payments: [] }],
    });
    expect(result.success).toBe(false);
  });
});
