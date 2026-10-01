import { describe, expect, it } from "vitest";
import { summarizeMonths } from "./months-summary";

describe("summarizeMonths", () => {
  it("lists up to three months", () => {
    expect(summarizeMonths(["2026-10"])).toBe("2026-10");
    expect(summarizeMonths(["2026-10", "2026-11", "2026-12"])).toBe("2026-10, 2026-11, 2026-12");
  });

  it("shortens a longer run to its first and last month", () => {
    const months = Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, "0")}`);
    expect(summarizeMonths(months)).toBe("2026-01–2026-12");
  });

  it("sorts and de-duplicates", () => {
    expect(summarizeMonths(["2026-12", "2026-10", "2026-10"])).toBe("2026-10, 2026-12");
  });

  it("returns an empty string for no months", () => {
    expect(summarizeMonths([])).toBe("");
  });
});
