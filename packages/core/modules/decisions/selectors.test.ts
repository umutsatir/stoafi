import { describe, expect, it } from "vitest";
import { savingsSummary } from "./selectors";
import type { Decision } from "./schema";

function decision(outcome: Decision["outcome"], amount: number, id: string): Decision {
  return { id, queueItemRef: id, outcome, timestamp: "2026-09-01T00:00:00.000Z", amount };
}

describe("savingsSummary", () => {
  it("sums only the skipped decisions' amounts", () => {
    const decisions = [
      decision("bought", 1000, "d1"),
      decision("postponed", 2000, "d2"),
      decision("skipped", 500, "d3"),
      decision("skipped", 300, "d4"),
    ];
    const result = savingsSummary(decisions);
    expect(result.totalSaved).toBe(800);
    expect(result.count).toBe(2);
  });

  it("returns zero for an empty list", () => {
    expect(savingsSummary([])).toEqual({ totalSaved: 0, count: 0 });
  });
});
