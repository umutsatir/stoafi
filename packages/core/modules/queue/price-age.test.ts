import { describe, expect, it } from "vitest";
import { PRICE_STALE_DAYS, priceAgeDays, priceIsStale } from "./price-age";

const item = (priceUpdatedDate: string) => ({ priceUpdatedDate });

describe("priceAgeDays", () => {
  it("counts the days since the price was last set", () => {
    expect(priceAgeDays(item("2026-07-01"), "2026-10-01")).toBe(92);
    expect(priceAgeDays(item("2026-10-01"), "2026-10-01")).toBe(0);
  });

  it("crosses a leap day and a year end correctly", () => {
    expect(priceAgeDays(item("2027-12-31"), "2028-03-01")).toBe(61);
  });

  it("is never negative for a price dated in the future", () => {
    expect(priceAgeDays(item("2026-11-01"), "2026-10-01")).toBe(0);
  });
});

describe("priceIsStale", () => {
  it("uses the threshold from the data file: stale from the day it is reached", () => {
    expect(PRICE_STALE_DAYS).toBe(90);
    expect(priceIsStale(item("2026-07-03"), "2026-10-01")).toBe(true);
    expect(priceIsStale(item("2026-07-04"), "2026-10-01")).toBe(false);
  });

  it("accepts a different threshold", () => {
    expect(priceIsStale(item("2026-09-20"), "2026-10-01", 10)).toBe(true);
    expect(priceIsStale(item("2026-09-30"), "2026-10-01", 10)).toBe(false);
  });
});
