import { describe, expect, it } from "vitest";
import { BANKS, BANKS_ARE_APPROXIMATE, bankById, cardColors } from "./banks";

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe("bank presets", () => {
  it("has unique ids and a generic fallback", () => {
    const ids = BANKS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(bankById("other")).toBeDefined();
  });

  it("states that the colours are approximate", () => {
    expect(BANKS_ARE_APPROXIMATE).toBe(true);
  });

  it.each(BANKS.map((b) => [b.id, b] as const))(
    "%s uses valid colours and readable text on both ends of its gradient",
    (_id, bank) => {
      for (const hex of [bank.from, bank.to, bank.text]) expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
      expect(contrast(bank.text, bank.from)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(bank.text, bank.to)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("returns undefined for an unknown bank", () => {
    expect(bankById("nope")).toBeUndefined();
  });
});

describe("cardColors", () => {
  it("uses the bank's gradient when the card has a bank", () => {
    expect(cardColors({ bankId: "akbank" })).toEqual({
      from: "#d1001f",
      to: "#8f0016",
      text: "#ffffff",
    });
  });

  it("builds a gradient from a custom colour, with readable text", () => {
    const light = cardColors({ color: "#f5f5f5" });
    expect(light.from).toBe("#f5f5f5");
    expect(contrast(light.text, light.from)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light.text, light.to)).toBeGreaterThanOrEqual(4.5);
    const dark = cardColors({ color: "#101010" });
    expect(contrast(dark.text, dark.from)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark.text, dark.to)).toBeGreaterThanOrEqual(4.5);
  });

  it("prefers the bank over a custom colour and falls back to the neutral card", () => {
    expect(cardColors({ bankId: "akbank", color: "#00ff00" }).from).toBe("#d1001f");
    expect(cardColors({})).toEqual(cardColors({ bankId: "other" }));
    expect(cardColors({ bankId: "unknown-bank" })).toEqual(cardColors({ bankId: "other" }));
  });
});
