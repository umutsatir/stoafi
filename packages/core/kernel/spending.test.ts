import { describe, expect, it } from "vitest";
import { freeSpending } from "./spending";

describe("freeSpending", () => {
  it("is what is left of the wants limit when the user did not set an amount", () => {
    const s = freeSpending({ wantsLimit: 1_800_000, wantsCommitted: 825_000, daysInMonth: 30 });
    expect(s).toEqual({ monthly: 975_000, weekly: 227_500, daily: 32_500, fixed: false });
  });

  it("is the amount the user set, even when the wants limit is smaller", () => {
    const s = freeSpending({
      wantsLimit: 1_000_000,
      wantsCommitted: 1_500_000,
      personal: 1_500_000,
      daysInMonth: 30,
    });
    expect(s.monthly).toBe(1_500_000);
    expect(s.fixed).toBe(true);
  });

  it("is never negative", () => {
    expect(freeSpending({ wantsLimit: 100, wantsCommitted: 900, daysInMonth: 30 }).monthly).toBe(0);
  });

  it("rounds once and survives odd amounts and month lengths", () => {
    const s = freeSpending({ wantsLimit: 100_001, wantsCommitted: 0, daysInMonth: 31 });
    expect(s.daily).toBe(3_226); // 3,225.8
    expect(s.weekly).toBe(22_581); // 22,580.6
    expect(freeSpending({ wantsLimit: 1, wantsCommitted: 0, daysInMonth: 28 }).daily).toBe(0);
  });

  it("treats a zero personal amount as not set, and guards a zero-day month", () => {
    expect(
      freeSpending({ wantsLimit: 500, wantsCommitted: 0, personal: 0, daysInMonth: 30 }).fixed,
    ).toBe(false);
    expect(freeSpending({ wantsLimit: 500, wantsCommitted: 0, daysInMonth: 0 }).daily).toBe(500);
  });
});
