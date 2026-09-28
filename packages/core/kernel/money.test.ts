import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { addMinor, roundHalfToEven, subMinor } from "./money";

describe("roundHalfToEven", () => {
  it("returns zero for zero", () => {
    expect(roundHalfToEven(0)).toBe(0);
  });

  it("returns the exact value for one kuruş", () => {
    expect(roundHalfToEven(1)).toBe(1);
  });

  it("rounds a very large amount without losing precision", () => {
    expect(roundHalfToEven(123_456_789_012)).toBe(123_456_789_012);
  });

  it("rounds 0.5 down to the nearest even integer (0)", () => {
    expect(roundHalfToEven(0.5)).toBe(0);
  });

  it("rounds 1.5 up to the nearest even integer (2)", () => {
    expect(roundHalfToEven(1.5)).toBe(2);
  });

  it("rounds 2.5 down to the nearest even integer (2)", () => {
    expect(roundHalfToEven(2.5)).toBe(2);
  });

  it("rounds values below the midpoint down", () => {
    expect(roundHalfToEven(2.49)).toBe(2);
  });

  it("rounds values above the midpoint up", () => {
    expect(roundHalfToEven(2.51)).toBe(3);
  });

  it("property: output is always an integer", () => {
    fc.assert(
      fc.property(fc.double({ min: -1e9, max: 1e9, noNaN: true }), (value) => {
        expect(Number.isInteger(roundHalfToEven(value))).toBe(true);
      }),
    );
  });
});

describe("addMinor / subMinor", () => {
  it("adds two minor amounts", () => {
    expect(addMinor(100, 50)).toBe(150);
  });

  it("subtracts two minor amounts", () => {
    expect(subMinor(100, 50)).toBe(50);
  });

  it("handles zero", () => {
    expect(addMinor(0, 0)).toBe(0);
    expect(subMinor(0, 0)).toBe(0);
  });
});
