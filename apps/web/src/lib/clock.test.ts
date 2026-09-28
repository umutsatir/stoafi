import { describe, expect, it } from "vitest";
import { localIsoDate, monthOf } from "./clock";

describe("clock helpers", () => {
  it("formats the local calendar date, not the UTC one", () => {
    expect(localIsoDate(new Date(2026, 8, 28, 23, 30))).toBe("2026-09-28");
    expect(localIsoDate(new Date(2026, 0, 5, 0, 5))).toBe("2026-01-05");
  });

  it("takes the month out of an ISO date", () => {
    expect(monthOf("2026-09-28")).toBe("2026-09");
  });
});
