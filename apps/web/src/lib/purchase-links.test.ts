import { describe, expect, it } from "vitest";
import type { Decision, QueueItem } from "@stoafi/core";
import { boughtDecisionsOf, installmentOfDecision } from "./purchase-links";

const item = (id: string, installment: boolean): QueueItem => ({
  id,
  name: id,
  price: 100_000,
  urgency: 2,
  importance: 2,
  isNeed: false,
  expectedUses: 10,
  addedDate: "2026-01-01",
  priceUpdatedDate: "2026-01-01",
  order: 0,
  ...(installment
    ? {
        installmentPurchase: {
          offer: { months: 2, payments: [50_000, 50_000] },
          firstMonth: "2026-10" as const,
        },
      }
    : {}),
});

const decision = (id: string, ref: string, outcome: Decision["outcome"]): Decision => ({
  id,
  queueItemRef: ref,
  outcome,
  timestamp: "2026-10-01T10:00:00.000Z",
  amount: 100_000,
});

describe("installmentOfDecision", () => {
  const items = [item("phone", true), item("tv", false)];

  it("finds the installment purchase behind a bought decision", () => {
    expect(installmentOfDecision(decision("d1", "phone", "bought"), items)?.id).toBe("phone");
  });

  it("finds nothing for skipped or postponed decisions, even for the same item", () => {
    expect(installmentOfDecision(decision("d2", "phone", "skipped"), items)).toBeUndefined();
    expect(installmentOfDecision(decision("d3", "phone", "postponed"), items)).toBeUndefined();
  });

  it("finds nothing when the item is still only waiting in the queue, or is gone", () => {
    expect(installmentOfDecision(decision("d4", "tv", "bought"), items)).toBeUndefined();
    expect(installmentOfDecision(decision("d5", "missing", "bought"), items)).toBeUndefined();
  });
});

describe("boughtDecisionsOf", () => {
  it("lists the bought entries for that item only", () => {
    const decisions = [
      decision("a", "phone", "bought"),
      decision("b", "phone", "skipped"),
      decision("c", "tv", "bought"),
    ];
    expect(boughtDecisionsOf(item("phone", true), decisions).map((d) => d.id)).toEqual(["a"]);
    expect(boughtDecisionsOf(item("none", true), decisions)).toEqual([]);
  });
});
