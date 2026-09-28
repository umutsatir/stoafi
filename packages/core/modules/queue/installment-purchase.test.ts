import { describe, expect, it } from "vitest";
import { CommitmentSchema } from "../../kernel/commitment";
import type { Month } from "../../kernel/month";
import { projectSeries } from "../../kernel/project";
import {
  activeQueueItems,
  installmentCommitments,
  toInstallmentCommitment,
} from "./installment-purchase";
import { QueueItemSchema, type QueueItem } from "./schema";

function makeItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: "item-1",
    name: "Washing machine",
    price: 3_000_000,
    urgency: 2,
    importance: 2,
    isNeed: true,
    expectedUses: 1000,
    addedDate: "2026-09-01",
    priceUpdatedDate: "2026-09-01",
    order: 0,
    ...overrides,
  };
}

const offer = { months: 3, payments: [1_100_000, 1_100_000, 1_100_000] };

describe("toInstallmentCommitment", () => {
  it("spreads the payments over consecutive months starting at the first month", () => {
    const commitment = toInstallmentCommitment(makeItem(), offer, "2026-11", "active");
    expect(commitment.payments).toEqual([
      { month: "2026-11", amount: 1_100_000 },
      { month: "2026-12", amount: 1_100_000 },
      { month: "2027-01", amount: 1_100_000 },
    ]);
  });

  it("is sourced from the installments module so projections count it as installment load", () => {
    const commitment = toInstallmentCommitment(makeItem(), offer, "2026-11", "active");
    expect(commitment.source).toEqual({ module: "installments", refId: "item-1" });
    expect(CommitmentSchema.safeParse(commitment).success).toBe(true);
  });

  it("uses the needs bucket for a need and wants for a want", () => {
    expect(
      toInstallmentCommitment(makeItem({ isNeed: true }), offer, "2026-11", "draft").bucket,
    ).toBe("needs");
    expect(
      toInstallmentCommitment(makeItem({ isNeed: false }), offer, "2026-11", "draft").bucket,
    ).toBe("wants");
  });

  it("carries the requested status", () => {
    expect(toInstallmentCommitment(makeItem(), offer, "2026-11", "draft").status).toBe("draft");
  });
});

describe("installmentCommitments", () => {
  const bought = makeItem({
    installmentPurchase: { offer, firstMonth: "2026-11" },
  });

  it("returns one active commitment per item bought in installments", () => {
    const result = installmentCommitments([bought, makeItem({ id: "other" })]);
    expect(result).toHaveLength(1);
    expect(result[0]?.status).toBe("active");
    expect(result[0]?.source.refId).toBe("item-1");
  });

  it("returns nothing when no item was bought in installments", () => {
    expect(installmentCommitments([makeItem()])).toEqual([]);
  });

  it("raises installment load in exactly the payment months", () => {
    const months: Month[] = ["2026-10", "2026-11", "2026-12", "2027-01", "2027-02"];
    const series = projectSeries({ income: 5_000_000 }, installmentCommitments([bought]), months);
    expect(series.map((p) => p.installmentLoad)).toEqual([0, 1_100_000, 1_100_000, 1_100_000, 0]);
  });
});

describe("activeQueueItems", () => {
  it("leaves out items already bought in installments", () => {
    const bought = makeItem({
      id: "bought",
      installmentPurchase: { offer, firstMonth: "2026-11" },
    });
    const waiting = makeItem({ id: "waiting" });
    expect(activeQueueItems([bought, waiting]).map((i) => i.id)).toEqual(["waiting"]);
  });
});

describe("QueueItemSchema installmentPurchase", () => {
  it("accepts an item bought in installments", () => {
    const item = makeItem({ installmentPurchase: { offer, firstMonth: "2026-11" } });
    expect(QueueItemSchema.safeParse(item).success).toBe(true);
  });

  it("rejects a purchase with a zero payment or a malformed first month", () => {
    const zeroPayment = makeItem({
      installmentPurchase: { offer: { months: 1, payments: [0] }, firstMonth: "2026-11" },
    });
    expect(QueueItemSchema.safeParse(zeroPayment).success).toBe(false);
    const badMonth = { ...makeItem(), installmentPurchase: { offer, firstMonth: "nov" } };
    expect(QueueItemSchema.safeParse(badMonth).success).toBe(false);
  });
});
