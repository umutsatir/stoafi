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
