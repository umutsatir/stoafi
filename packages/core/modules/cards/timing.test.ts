import { describe, expect, it } from "vitest";
import { timingTip } from "./timing";
import type { Card } from "./schema";

const card: Card = { id: "c1", label: "Visa", statementDay: 15, dueDay: 5 };

describe("timingTip", () => {
  it("returns null when buying before the statement day", () => {
    const result = timingTip(card, "2026-09-10");
    expect(result).toBeNull();
  });

  it("returns a shift with extraFloatDays and newDueMonth when buying after the statement day", () => {
    const result = timingTip(card, "2026-09-20");
    expect(result).not.toBeNull();
    expect(result?.shifted).toBe(true);
    // baseline due: 2026-10-05 (next month after purchase). shifted due: 2026-11-05.
    expect(result?.newDueMonth).toBe("2026-11");
    expect(result?.extraFloatDays).toBe(31); // days between 2026-10-05 and 2026-11-05
  });
});
