import { describe, expect, it } from "vitest";
import { formatDay, formatMonth } from "./format-month";

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

describe("formatDay", () => {
  it("names the day in the given language", () => {
    expect(formatDay("2026-10-20", "en")).toBe("Oct 20, 2026");
    expect(formatDay("2026-10-20", "tr")).toBe("20 Eki 2026");
  });

  it("reads the day of an ISO timestamp without a timezone shift", () => {
    expect(formatDay("2026-12-31T23:30:00.000Z", "en")).toBe("Dec 31, 2026");
  });

  it("returns the text unchanged when it is not a day", () => {
    expect(formatDay("before-import", "en")).toBe("before-import");
  });
});
