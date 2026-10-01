import { describe, expect, it } from "vitest";
import {
  CardSchema,
  DecisionSchema,
  HoldingSchema,
  PlanStateSchema,
  ProfileSchema,
  QueueItemSchema,
  SinkingFundSchema,
  validateCardSet,
} from "@stoafi/core";
import { buildDemoData, type DemoLabels } from "./demo-data";

const labels: DemoLabels = Object.fromEntries(
  [
    "salary",
    "rent",
    "car",
    "streaming",
    "headphones",
    "washer",
    "laptop",
    "phone",
    "insurance",
    "holiday",
    "gold",
    "fund",
    "card",
    "spouse",
    "jacket",
    "watch",
  ].map((k) => [k, k]),
) as unknown as DemoLabels;

describe("buildDemoData", () => {
  const data = buildDemoData("2026-10-15", labels);

  it("passes every schema the app saves with", () => {
    expect(ProfileSchema.safeParse(data.profile).success).toBe(true);
    expect(PlanStateSchema.safeParse(data.planState).success).toBe(true);
    for (const item of data.queueItems) expect(QueueItemSchema.safeParse(item).success).toBe(true);
    for (const fund of data.sinkingFunds)
      expect(SinkingFundSchema.safeParse(fund).success).toBe(true);
    for (const card of data.cards) expect(CardSchema.safeParse(card).success).toBe(true);
    for (const d of data.decisions) expect(DecisionSchema.safeParse(d).success).toBe(true);
    for (const h of data.holdings) expect(HoldingSchema.safeParse(h).success).toBe(true);
  });

  it("is consistent: cards form a valid set and the bought phone uses a card that exists", () => {
    expect(validateCardSet(data.cards)).toEqual([]);
    const phone = data.queueItems.find((i) => i.installmentPurchase);
    expect(data.cards.some((c) => c.id === phone?.installmentPurchase?.cardId)).toBe(true);
  });

  it("is dated from today, so it looks current whenever it is loaded", () => {
    expect(data.sinkingFunds[0]?.dueMonth).toBe("2027-04");
    expect(
      data.queueItems.find((i) => i.installmentPurchase)?.installmentPurchase?.firstMonth,
    ).toBe("2026-10");
    expect(data.decisions[0]?.timestamp.startsWith("2026-10-05")).toBe(true);
    const later = buildDemoData("2027-01-31", labels);
    expect(later.sinkingFunds[0]?.dueMonth).toBe("2027-07");
  });

  it("uses the labels it is given, never fixed text", () => {
    const named = buildDemoData("2026-10-15", { ...labels, salary: "Maaş" });
    expect(named.profile.incomes[0]?.label).toBe("Maaş");
  });

  it("gives every record a unique id so loading it twice replaces rather than duplicates", () => {
    const ids = [
      ...data.queueItems.map((i) => i.id),
      ...data.sinkingFunds.map((f) => f.id),
      ...data.cards.map((c) => c.id),
      ...data.decisions.map((d) => d.id),
      ...data.holdings.map((h) => h.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
