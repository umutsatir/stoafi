import { describe, expect, it } from "vitest";
import { buildAiExport, type AiExportData, type AiExportInput } from "./ai-export";

const data: AiExportData = {
  incomes: [{ label: "Acme salary", monthly: 6_000_000 }],
  expenses: [
    { label: "Rent", monthly: 1_800_000, bucket: "needs" },
    { label: "Netflix", monthly: 25_000, bucket: "wants" },
  ],
  living: 1_200_000,
  emergency: { balance: 9_012_345, targetMonths: 6, monthsSaved: 2.6 },
  left: 1_755_000,
  plan: { name: "The 50/30/20 rule", source: "Elizabeth Warren, All Your Worth" },
  queue: [
    { name: "Headphones", price: 300_000, month: "2026-11" },
    { name: "Laptop", price: 4_500_000, month: null },
  ],
  installments: [{ name: "Phone", payment: 800_000, endsMonth: "2026-12" }],
  pots: [{ label: "Car insurance", balance: 150_000, target: 600_000, dueMonth: "2027-04" }],
  holdings: [{ label: "Gram gold", type: "Gold", value: 3_750_000, cost: 2_500_000 }],
  cards: [{ label: "Bonus", limit: 5_000_000, dueDay: 5 }],
  decisions: [{ name: "Jacket", outcome: "skipped", amount: 400_000 }],
  health: { savingsRate: 0.12, installmentRatio: 0.133, runwayMonths: 2.1 },
};

const input = (over: Partial<AiExportInput> = {}): AiExportInput => ({
  language: "en",
  currency: "TRY",
  level: "full",
  question: { id: "assessBudget" },
  data,
  ...over,
});

describe("buildAiExport: full detail", () => {
  const text = buildAiExport(input());

  it("states the unit: amounts are in whole currency units, not minor units", () => {
    expect(text).toMatch(/TRY/);
    expect(text).toMatch(/not (kuruş|cents|minor)/i);
    expect(text).toContain("60,000");
    expect(text).not.toContain("6,000,000");
  });

  it("includes real labels and the figures Stoafi worked out", () => {
    expect(text).toContain("Acme salary");
    expect(text).toContain("Rent");
    expect(text).toContain("Headphones");
    expect(text).toContain("17,550");
    expect(text).toContain("The 50/30/20 rule");
    expect(text).toContain("Elizabeth Warren, All Your Worth");
    expect(text).toContain("Gram gold");
    expect(text).toContain("Jacket");
  });

  it("tells the assistant not to invent numbers, to ask first and to keep to three suggestions", () => {
    expect(text).toMatch(/do not (make up|invent)/i);
    expect(text).toMatch(/clarifying questions/i);
    expect(text).toMatch(/three suggestions|3 suggestions/i);
    expect(text).toMatch(/not a regulated|not a licensed/i);
  });

  it("ends with the chosen question", () => {
    expect(text.trim().endsWith("Assess my budget.")).toBe(true);
  });

  it("says when an item does not fit in the next twelve months", () => {
    expect(text).toMatch(/Laptop[^\n]*does not fit/i);
  });
});

describe("buildAiExport: rounded", () => {
  const text = buildAiExport(input({ level: "rounded" }));

  it("rounds amounts to the nearest hundred and drops exact figures", () => {
    expect(text).toContain("90,100");
    expect(text).not.toContain("90,123");
    expect(text).not.toContain("90123");
  });

  it("replaces labels with generic ones", () => {
    expect(text).not.toContain("Acme");
    expect(text).not.toContain("Netflix");
    expect(text).not.toContain("Jacket");
    expect(text).toMatch(/Income 1/);
    expect(text).toMatch(/need/i);
  });
});

describe("buildAiExport: ratios only", () => {
  const text = buildAiExport(input({ level: "ratios" }));

  it("contains no amount of money at all, only shares of income and months", () => {
    for (const secret of [
      "60,000",
      "6,000",
      "18,000",
      "90,123",
      "17,550",
      "3,000",
      "45,000",
      "5,000",
      "1,500",
      "7,500",
      "37,500",
      "25,000",
    ]) {
      expect(text, secret).not.toContain(secret);
    }
    expect(text).toMatch(/\d+(\.\d+)?%/);
    expect(text).not.toContain("Acme");
    expect(text).toMatch(/months/i);
  });

  it("shows expenses and the queue as a share of monthly income", () => {
    // Rent 18,000 of 60,000 income = 30%
    expect(text).toContain("30%");
    // Headphones 3,000 of 60,000 = 5%
    expect(text).toContain("5%");
  });
});

describe("buildAiExport: language and questions", () => {
  it("writes in Turkish when asked, with the Turkish question", () => {
    const text = buildAiExport(input({ language: "tr", question: { id: "whatToCut" } }));
    expect(text).toMatch(/Rolün|Rol/);
    expect(text).toMatch(/uydurma/i);
    expect(text.trim().endsWith("Bu ay neyi kısmalıyım?")).toBe(true);
  });

  it("asks about a specific item for the buy question", () => {
    const text = buildAiExport(input({ question: { id: "canIBuy", item: "Laptop" } }));
    expect(text.trim().endsWith("Should I buy Laptop?")).toBe(true);
  });

  it("uses the user's own words for a free question, trimmed", () => {
    const text = buildAiExport(
      input({ question: { id: "free", text: "  Is gold a good idea?  " } }),
    );
    expect(text.trim().endsWith("Is gold a good idea?")).toBe(true);
  });

  it("covers every question id in both languages", () => {
    for (const language of ["en", "tr"] as const) {
      for (const id of [
        "assessBudget",
        "whatToCut",
        "installmentOrCash",
        "emergencyFaster",
      ] as const) {
        const text = buildAiExport(input({ language, question: { id } }));
        expect(text.length).toBeGreaterThan(200);
      }
    }
  });
});

describe("buildAiExport: missing pieces", () => {
  it("leaves out sections with nothing in them instead of printing empty headings", () => {
    const text = buildAiExport(
      input({
        data: {
          ...data,
          queue: [],
          installments: [],
          pots: [],
          holdings: [],
          cards: [],
          decisions: [],
          plan: undefined,
        },
      }),
    );
    expect(text).not.toMatch(/Queue/i);
    expect(text).not.toMatch(/Investments/i);
    expect(text).not.toMatch(/Cards/i);
  });

  it("copes with no income at all, without dividing by zero in ratio mode", () => {
    const text = buildAiExport(
      input({ level: "ratios", data: { ...data, incomes: [], expenses: [], queue: [] } }),
    );
    expect(text).not.toMatch(/NaN|Infinity/);
  });

  it("formats very large amounts without losing digits", () => {
    const text = buildAiExport(input({ data: { ...data, left: 99_999_999_999_00 } }));
    expect(text).toContain("99,999,999,999");
  });
});
