import { describe, expect, it } from "vitest";
import {
  WORK_HOURS_PER_DAY,
  decisionStats,
  filterDecisions,
  groupDecisionsByMonth,
  savingsSummary,
} from "./selectors";
import type { Decision } from "./schema";

function decision(
  outcome: Decision["outcome"],
  amount: number,
  id: string,
  timestamp = "2026-09-01T00:00:00.000Z",
): Decision {
  return { id, queueItemRef: id, outcome, timestamp, amount };
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

describe("decisionStats", () => {
  it("totals what was saved, bought and postponed, and converts the saving to work days", () => {
    const decisions = [
      decision("skipped", 80_000, "a"),
      decision("bought", 30_000, "b"),
      decision("bought", 20_000, "c"),
      decision("postponed", 99_000, "d"),
    ];
    // Hourly net income 1,000 (minor): 80,000 saved is 80 hours, 10 work days of 8 hours.
    expect(decisionStats(decisions, 1_000)).toEqual({
      saved: 80_000,
      savedCount: 1,
      bought: 50_000,
      boughtCount: 2,
      postponedCount: 1,
      savedWorkDays: 80_000 / 1_000 / WORK_HOURS_PER_DAY,
    });
  });

  it("has no work-day figure when the hourly income is unknown or zero", () => {
    expect(decisionStats([decision("skipped", 5_000, "a")], 0).savedWorkDays).toBeNull();
    expect(decisionStats([decision("skipped", 5_000, "a")], undefined).savedWorkDays).toBeNull();
  });

  it("is all zeros for no decisions", () => {
    expect(decisionStats([], 1_000)).toEqual({
      saved: 0,
      savedCount: 0,
      bought: 0,
      boughtCount: 0,
      postponedCount: 0,
      savedWorkDays: 0,
    });
  });

  it("handles very large amounts without losing precision", () => {
    const big = Number.MAX_SAFE_INTEGER / 4;
    expect(decisionStats([decision("skipped", big, "a")], 1).saved).toBe(big);
  });
});

describe("filterDecisions", () => {
  const all = [
    decision("bought", 1, "a"),
    decision("skipped", 2, "b"),
    decision("postponed", 3, "c"),
  ];

  it("keeps everything for all, and only the chosen outcome otherwise", () => {
    expect(filterDecisions(all, "all")).toHaveLength(3);
    expect(filterDecisions(all, "skipped").map((d) => d.id)).toEqual(["b"]);
    expect(filterDecisions(all, "bought").map((d) => d.id)).toEqual(["a"]);
  });
});

describe("groupDecisionsByMonth", () => {
  it("groups by the month of the timestamp, newest month and newest decision first", () => {
    const groups = groupDecisionsByMonth([
      decision("bought", 1, "sep-early", "2026-09-02T10:00:00.000Z"),
      decision("skipped", 2, "oct", "2026-10-05T10:00:00.000Z"),
      decision("bought", 3, "sep-late", "2026-09-28T10:00:00.000Z"),
    ]);
    expect(groups.map((g) => g.month)).toEqual(["2026-10", "2026-09"]);
    expect(groups[1]?.decisions.map((d) => d.id)).toEqual(["sep-late", "sep-early"]);
  });

  it("returns no groups for no decisions", () => {
    expect(groupDecisionsByMonth([])).toEqual([]);
  });
});
