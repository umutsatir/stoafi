import { describe, expect, it } from "vitest";
import { addMonths, compareMonths, monthsBetween, parseMonth } from "./month";

describe("parseMonth", () => {
  it("parses a valid month string", () => {
    expect(parseMonth("2026-09")).toEqual({ year: 2026, month: 9 });
  });

  it("throws on a malformed string", () => {
    expect(() => parseMonth("2026-9")).toThrow();
    expect(() => parseMonth("not-a-month")).toThrow();
  });
});

describe("addMonths", () => {
  it("adds months within the same year", () => {
    expect(addMonths("2026-01", 2)).toBe("2026-03");
  });

  it("rolls over into the next year", () => {
    expect(addMonths("2026-11", 3)).toBe("2027-02");
  });

  it("rolls back with a negative offset", () => {
    expect(addMonths("2026-02", -3)).toBe("2025-11");
  });

  it("adding zero returns the same month", () => {
    expect(addMonths("2026-06", 0)).toBe("2026-06");
  });
});

describe("compareMonths", () => {
  it("returns 0 for equal months", () => {
    expect(compareMonths("2026-05", "2026-05")).toBe(0);
  });

  it("returns negative when the first month is earlier", () => {
    expect(compareMonths("2026-01", "2026-05")).toBeLessThan(0);
  });

  it("returns positive when the first month is later", () => {
    expect(compareMonths("2026-05", "2026-01")).toBeGreaterThan(0);
  });

  it("compares across year boundaries", () => {
    expect(compareMonths("2025-12", "2026-01")).toBeLessThan(0);
  });
});

describe("monthsBetween", () => {
  it("returns 0 for the same month", () => {
    expect(monthsBetween("2026-05", "2026-05")).toBe(0);
  });

  it("returns a positive count moving forward", () => {
    expect(monthsBetween("2026-01", "2026-04")).toBe(3);
  });

  it("returns a negative count moving backward", () => {
    expect(monthsBetween("2026-04", "2026-01")).toBe(-3);
  });

  it("counts across year boundaries", () => {
    expect(monthsBetween("2025-11", "2026-02")).toBe(3);
  });
});

describe("parseMonth rejects impossible months", () => {
  it("throws for month 00 and month 13", () => {
    expect(() => parseMonth("2026-00")).toThrow("Invalid Month string");
    expect(() => parseMonth("2026-13")).toThrow("Invalid Month string");
  });
});
