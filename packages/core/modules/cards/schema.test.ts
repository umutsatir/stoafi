import { describe, expect, it } from "vitest";
import { CardSchema } from "./schema";

describe("CardSchema", () => {
  it("parses a valid card", () => {
    const result = CardSchema.safeParse({
      id: "card-1",
      label: "Visa",
      statementDay: 15,
      dueDay: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects statementDay outside 1-31", () => {
    expect(CardSchema.safeParse({ id: "c", label: "V", statementDay: 0, dueDay: 5 }).success).toBe(
      false,
    );
    expect(CardSchema.safeParse({ id: "c", label: "V", statementDay: 32, dueDay: 5 }).success).toBe(
      false,
    );
  });

  it("rejects dueDay outside 1-31", () => {
    expect(CardSchema.safeParse({ id: "c", label: "V", statementDay: 15, dueDay: 0 }).success).toBe(
      false,
    );
    expect(
      CardSchema.safeParse({ id: "c", label: "V", statementDay: 15, dueDay: 32 }).success,
    ).toBe(false);
  });
});

describe("CardSchema supplementary cards", () => {
  const base = { id: "c", label: "Bonus", statementDay: 15, dueDay: 5 };

  it("keeps cards saved before supplementary cards existed valid", () => {
    expect(CardSchema.safeParse(base).success).toBe(true);
  });

  it("accepts a main card with a limit, bank, network and last four digits", () => {
    const result = CardSchema.safeParse({
      ...base,
      kind: "main",
      limit: 5_000_000,
      bankId: "garanti-bbva",
      network: "mastercard",
      last4: "1234",
    });
    expect(result.success).toBe(true);
  });

  it("requires a supplementary card to point at a main card", () => {
    expect(CardSchema.safeParse({ ...base, kind: "supplementary" }).success).toBe(false);
    expect(CardSchema.safeParse({ ...base, kind: "supplementary", parentId: "main" }).success).toBe(
      true,
    );
  });

  it("rejects a parent on a main card", () => {
    expect(CardSchema.safeParse({ ...base, parentId: "main" }).success).toBe(false);
    expect(CardSchema.safeParse({ ...base, kind: "main", parentId: "main" }).success).toBe(false);
  });

  it("gives a supplementary card no limit of its own, it shares the main card's", () => {
    expect(
      CardSchema.safeParse({ ...base, kind: "supplementary", parentId: "main", limit: 100 })
        .success,
    ).toBe(false);
  });

  it("rejects a negative or fractional limit, a bad network and a last4 that is not four digits", () => {
    expect(CardSchema.safeParse({ ...base, limit: -1 }).success).toBe(false);
    expect(CardSchema.safeParse({ ...base, limit: 10.5 }).success).toBe(false);
    expect(CardSchema.safeParse({ ...base, network: "discover" }).success).toBe(false);
    for (const last4 of ["123", "12345", "12a4", ""]) {
      expect(CardSchema.safeParse({ ...base, last4 }).success).toBe(false);
    }
  });

  it("accepts a zero limit and a manually entered current debt", () => {
    expect(CardSchema.safeParse({ ...base, limit: 0, currentDebt: 0 }).success).toBe(true);
    expect(CardSchema.safeParse({ ...base, currentDebt: -5 }).success).toBe(false);
  });
});
