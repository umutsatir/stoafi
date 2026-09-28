import { describe, expect, it } from "vitest";
import {
  formatMinorForInput,
  formatPercentForInput,
  parseMinor,
  parsePercent,
} from "./amount-text";

describe("parseMinor", () => {
  it("treats empty text as zero", () => {
    expect(parseMinor("", "en")).toBe(0);
    expect(parseMinor("   ", "tr")).toBe(0);
  });

  it("converts whole amounts to minor units", () => {
    expect(parseMinor("300", "en")).toBe(30_000);
  });

  it("handles one kuruş exactly, in both locales", () => {
    expect(parseMinor("0.01", "en")).toBe(1);
    expect(parseMinor("0,01", "tr")).toBe(1);
  });

  it("pads a single decimal digit", () => {
    expect(parseMinor("12,5", "tr")).toBe(1_250);
    expect(parseMinor("12.5", "en")).toBe(1_250);
  });

  it("accepts locale grouping separators", () => {
    expect(parseMinor("1.250,50", "tr")).toBe(125_050);
    expect(parseMinor("1,250.50", "en")).toBe(125_050);
    expect(parseMinor("1.250", "tr")).toBe(125_000);
    expect(parseMinor("1,250", "en")).toBe(125_000);
  });

  it("accepts the other decimal separator when it cannot be grouping", () => {
    expect(parseMinor("1,5", "en")).toBe(150);
    expect(parseMinor("1.5", "tr")).toBe(150);
  });

  it("stays exact for very large amounts (no float rounding)", () => {
    expect(parseMinor("90071992547409.91", "en")).toBe(9_007_199_254_740_991);
  });

  it("rejects negatives, letters and more than two decimals", () => {
    expect(parseMinor("-5", "en")).toBeNull();
    expect(parseMinor("abc", "en")).toBeNull();
    expect(parseMinor("1.555", "en")).toBeNull();
    expect(parseMinor("1,2,3", "en")).toBeNull();
  });
});

describe("formatMinorForInput", () => {
  it("shows zero as empty so typing starts clean", () => {
    expect(formatMinorForInput(0, "en")).toBe("");
  });

  it("omits decimals for whole amounts and uses the locale decimal separator", () => {
    expect(formatMinorForInput(30_000, "en")).toBe("300");
    expect(formatMinorForInput(1_250, "tr")).toBe("12,5");
    expect(formatMinorForInput(1_205, "en")).toBe("12.05");
    expect(formatMinorForInput(1, "tr")).toBe("0,01");
  });

  it("round-trips through parseMinor", () => {
    for (const minor of [1, 99, 100, 101, 123_456, 9_007_199_254_740_991]) {
      expect(parseMinor(formatMinorForInput(minor, "tr"), "tr")).toBe(minor);
      expect(parseMinor(formatMinorForInput(minor, "en"), "en")).toBe(minor);
    }
  });
});

describe("percent text", () => {
  it("parses whole and fractional percents to a ratio", () => {
    expect(parsePercent("30", "en")).toBeCloseTo(0.3, 10);
    expect(parsePercent("12,5", "tr")).toBeCloseTo(0.125, 10);
    expect(parsePercent("", "en")).toBe(0);
  });

  it("rejects negatives and garbage", () => {
    expect(parsePercent("-1", "en")).toBeNull();
    expect(parsePercent("x", "en")).toBeNull();
  });

  it("formats a ratio as a percent number for the input", () => {
    expect(formatPercentForInput(0.3, "en")).toBe("30");
    expect(formatPercentForInput(0.125, "tr")).toBe("12,5");
    expect(formatPercentForInput(0, "en")).toBe("");
  });
});
