import { describe, expect, it } from "vitest";
import { SinkingFundSchema, toCommitment } from "./schema";
import { monthsBetween } from "../../kernel/month";

describe("SinkingFundSchema", () => {
  it("parses a valid fund", () => {
    const result = SinkingFundSchema.safeParse({
      id: "f1",
      label: "Car insurance",
      target: 12000,
      dueMonth: "2027-01",
      currentBalance: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe("toCommitment", () => {
  it("produces one payment per remaining month summing to the target within 1 minor unit", () => {
    const fund = {
      id: "f1",
      label: "Car insurance",
      target: 6000,
      dueMonth: "2026-07" as const,
      currentBalance: 0,
    };
    const commitment = toCommitment(fund, "2026-01");
    const monthsRemaining = monthsBetween("2026-01", "2026-07");

    expect(commitment.payments).toHaveLength(monthsRemaining);
    const total = commitment.payments.reduce((sum, p) => sum + p.amount, 0);
    expect(Math.abs(total - fund.target)).toBeLessThanOrEqual(1);
  });

  it("produces all-zero payments when the fund is already fully funded", () => {
    const fund = {
      id: "f2",
      label: "Fully funded",
      target: 1000,
      dueMonth: "2026-07" as const,
      currentBalance: 1000,
    };
    const commitment = toCommitment(fund, "2026-01");
    expect(commitment.payments.every((p) => p.amount === 0)).toBe(true);
    expect(commitment.payments.length).toBeGreaterThan(0);
  });
});
