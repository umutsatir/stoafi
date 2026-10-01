import { describe, expect, it } from "vitest";
import { formatMonth } from "./format-month";

describe("formatMonth", () => {
  it("names the month in the given language", () => {
    expect(formatMonth("2026-11", "en")).toBe("November 2026");
    expect(formatMonth("2026-11", "tr")).toBe("Kasım 2026");
  });

  it("handles January and December without a timezone shift", () => {
    expect(formatMonth("2027-01", "en")).toBe("January 2027");
    expect(formatMonth("2026-12", "en")).toBe("December 2026");
  });

  it("returns the text unchanged when it is not a month", () => {
    expect(formatMonth("soon", "en")).toBe("soon");
  });
});
