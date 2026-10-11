import { describe, expect, it } from "vitest";
import { INVESTMENT_TYPES } from "../investments/types";
import { SinkingFundSchema } from "./schema";
import { HELD_IN_OPTIONS, emergencyFit, heldInValue, parseHeldIn } from "./held-in";

describe("held-in options", () => {
  it("are plain cash plus the investment types, so the two lists never drift apart", () => {
    const types = new Set(INVESTMENT_TYPES.map((t) => t.id));
    for (const option of HELD_IN_OPTIONS) {
      if (option.id === "cash") continue;
      expect(types.has(option.id), option.id).toBe(true);
    }
    expect(HELD_IN_OPTIONS.some((o) => o.id === "cash")).toBe(true);
    expect(new Set(HELD_IN_OPTIONS.map((o) => o.id)).size).toBe(HELD_IN_OPTIONS.length);
  });
});

describe("heldInValue and parseHeldIn", () => {
  it("store a preset by its id and a custom one by its name", () => {
    expect(heldInValue("gold")).toBe("gold");
    expect(heldInValue("custom", "  Gram altın hesabı ")).toBe("custom:Gram altın hesabı");
    expect(parseHeldIn("gold")).toEqual({ typeId: "gold", customName: "" });
    expect(parseHeldIn("custom:My vault")).toEqual({ typeId: "custom", customName: "My vault" });
  });

  it("give nothing for an empty choice, an empty custom name or an unknown id", () => {
    expect(heldInValue("")).toBeUndefined();
    expect(heldInValue("custom", "   ")).toBeUndefined();
    expect(heldInValue("unicorns")).toBeUndefined();
    expect(parseHeldIn(undefined)).toEqual({ typeId: "", customName: "" });
    expect(parseHeldIn("unicorns")).toEqual({ typeId: "", customName: "" });
  });

  it("cut a very long custom name", () => {
    expect(heldInValue("custom", "x".repeat(100))?.length).toBe("custom:".length + 40);
  });

  it("round trip", () => {
    for (const v of ["cash", "fund", "custom:Somewhere"]) {
      const { typeId, customName } = parseHeldIn(v);
      expect(heldInValue(typeId, customName)).toBe(v);
    }
  });
});

describe("emergencyFit", () => {
  it("says how well something suits an emergency fund", () => {
    expect(emergencyFit("deposit")).toBe("good");
    expect(emergencyFit("gold")).toBe("ok");
    expect(emergencyFit("crypto")).toBe("risky");
    expect(emergencyFit("custom:Mattress")).toBe("ok");
  });

  it("says nothing when nothing is chosen or the value is unknown", () => {
    expect(emergencyFit(undefined)).toBeNull();
    expect(emergencyFit("unicorns")).toBeNull();
  });
});

describe("a pot with a held-in value", () => {
  it("is valid, and a pot without one still is", () => {
    const base = { id: "p", label: "P", target: 0, currentBalance: 0 };
    expect(SinkingFundSchema.safeParse({ ...base, heldIn: "gold" }).success).toBe(true);
    expect(SinkingFundSchema.safeParse(base).success).toBe(true);
    expect(SinkingFundSchema.safeParse({ ...base, heldIn: "x".repeat(80) }).success).toBe(false);
  });
});
