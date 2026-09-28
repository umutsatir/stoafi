import { describe, expect, it } from "vitest";
import { CommitmentSchema } from "./commitment";

const baseSource = { module: "queue", refId: "item-1" };

describe("CommitmentSchema", () => {
  it("parses a one-off commitment (1 payment)", () => {
    const result = CommitmentSchema.safeParse({
      id: "c1",
      source: baseSource,
      bucket: "wants",
      payments: [{ month: "2026-09", amount: 5000 }],
      status: "draft",
    });
    expect(result.success).toBe(true);
  });

  it("parses an installment commitment (N payments)", () => {
    const result = CommitmentSchema.safeParse({
      id: "c2",
      source: baseSource,
      bucket: "wants",
      payments: [
        { month: "2026-09", amount: 1000 },
        { month: "2026-10", amount: 1000 },
        { month: "2026-11", amount: 1000 },
      ],
      status: "active",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a commitment with zero payments", () => {
    const result = CommitmentSchema.safeParse({
      id: "c3",
      source: baseSource,
      bucket: "wants",
      payments: [],
      status: "draft",
    });
    expect(result.success).toBe(false);
  });

  it("only accepts the four defined status values", () => {
    for (const status of ["draft", "active", "done", "cancelled"]) {
      const result = CommitmentSchema.safeParse({
        id: "c4",
        source: baseSource,
        bucket: "needs",
        payments: [{ month: "2026-09", amount: 100 }],
        status,
      });
      expect(result.success).toBe(true);
    }

    const invalid = CommitmentSchema.safeParse({
      id: "c5",
      source: baseSource,
      bucket: "needs",
      payments: [{ month: "2026-09", amount: 100 }],
      status: "pending",
    });
    expect(invalid.success).toBe(false);
  });

  it("accepts an optional cardId", () => {
    const result = CommitmentSchema.safeParse({
      id: "c6",
      source: baseSource,
      bucket: "wants",
      payments: [{ month: "2026-09", amount: 100 }],
      status: "draft",
      cardId: "card-1",
    });
    expect(result.success).toBe(true);
  });
});
