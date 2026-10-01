import { describe, expect, it } from "vitest";
import { buildAiExport, type Holding, type Profile, type QueueItem } from "@stoafi/core";
import { buildLedger } from "@/store/ledger";
import { buildAiExportData, type AiExportState } from "./ai-export-input";

const profile: Profile = {
  incomes: [{ label: "Job", monthly: 6_000_000 }],
  fixedExpenses: [
    { label: "Rent", monthly: 1_800_000, bucket: "needs" },
    { label: "Old loan", monthly: 500_000, bucket: "needs", endMonth: "2026-08" },
  ],
  livingExpenses: 1_200_000,
  savings: 9_000_000,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};
const queue = (over: Partial<QueueItem> & { id: string }): QueueItem => ({
  name: over.id,
  price: 300_000,
  urgency: 2,
  importance: 2,
  isNeed: false,
  expectedUses: 10,
  addedDate: "2020-01-01",
  priceUpdatedDate: "2020-01-01",
  order: 0,
  ...over,
});
const phone = queue({
  id: "phone",
  name: "Phone",
  installmentPurchase: {
    offer: { months: 4, payments: [800_000, 800_000, 800_000, 800_000] },
    firstMonth: "2026-09",
  },
});
const done = queue({
  id: "tv",
  name: "TV",
  installmentPurchase: {
    offer: { months: 2, payments: [100_000, 100_000] },
    firstMonth: "2026-01",
  },
});
const gold: Holding = {
  id: "g",
  label: "Gram gold",
  typeId: "gold",
  currentPrice: 300_000,
  priceDate: "2026-10-01",
  trades: [{ id: "t", date: "2026-01-10", side: "buy", quantity: 2, unitPrice: 200_000 }],
};

function state(over: Partial<AiExportState> = {}): AiExportState {
  const queueItems = [queue({ id: "headphones", name: "Headphones" }), phone, done];
  return {
    profile,
    planState: { strategyId: "fifty-thirty-twenty", params: {} },
    queueItems,
    sinkingFunds: [
      {
        id: "f",
        label: "Car insurance",
        target: 600_000,
        dueMonth: "2027-04",
        currentBalance: 150_000,
      },
    ],
    holdings: [gold],
    cards: [
      { id: "c1", label: "Bonus", statementDay: 1, dueDay: 5, kind: "main", limit: 5_000_000 },
      {
        id: "c2",
        label: "Spouse",
        statementDay: 1,
        dueDay: 9,
        kind: "supplementary",
        parentId: "c1",
      },
    ],
    decisions: [
      {
        id: "d1",
        queueItemRef: "x",
        itemName: "Jacket",
        outcome: "skipped",
        timestamp: "2026-09-20T10:00:00.000Z",
        amount: 400_000,
      },
      {
        id: "d2",
        queueItemRef: "y",
        outcome: "bought",
        timestamp: "2026-08-20T10:00:00.000Z",
        amount: 100_000,
      },
    ],
    ledger: buildLedger(profile, queueItems, "2026-10", []),
    installmentCapPct: 0.2,
    today: "2026-10-15",
    month: "2026-10",
    locale: "en",
    typeName: () => "Gold",
    ...over,
  };
}

describe("buildAiExportData", () => {
  it("collects income, current expenses only and living costs", () => {
    const data = buildAiExportData(state());
    expect(data.incomes).toEqual([{ label: "Job", monthly: 6_000_000 }]);
    expect(data.expenses.map((e) => e.label)).toEqual(["Rent"]);
    expect(data.living).toBe(1_200_000);
  });

  it("names the plan and its source from the lesson card", () => {
    expect(buildAiExportData(state()).plan).toMatchObject({ name: "The 50/30/20 rule" });
  });

  it("lists what is waiting with its month, and installments still running only", () => {
    const data = buildAiExportData(state());
    expect(data.queue.map((q) => q.name)).toEqual(["Headphones"]);
    expect(data.installments).toEqual([{ name: "Phone", payment: 800_000, endsMonth: "2026-12" }]);
  });

  it("includes pots, holdings with worth and cost, main cards only and the newest decisions", () => {
    const data = buildAiExportData(state());
    expect(data.pots).toEqual([
      { label: "Car insurance", balance: 150_000, target: 600_000, dueMonth: "2027-04" },
    ]);
    expect(data.holdings).toEqual([
      { label: "Gram gold", type: "Gold", value: 600_000, cost: 400_000 },
    ]);
    expect(data.cards.map((c) => c.label)).toEqual(["Bonus"]);
    expect(data.decisions[0]).toMatchObject({ name: "Jacket", outcome: "skipped" });
  });

  it("works without a plan", () => {
    const data = buildAiExportData(state({ planState: null }));
    expect(data.plan).toBeUndefined();
    expect(data.queue[0]?.month).toBeNull();
  });

  it("builds a prompt that contains the user's own figures end to end", () => {
    const text = buildAiExport({
      language: "en",
      currency: "TRY",
      level: "full",
      question: { id: "assessBudget" },
      data: buildAiExportData(state()),
    });
    expect(text).toContain("Gram gold");
    expect(text).toContain("60,000");
    expect(text).toContain("The 50/30/20 rule");
  });
});
