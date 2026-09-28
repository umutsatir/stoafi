import { describe, expect, it } from "vitest";
import { scheduleQueue } from "./scheduler";
import type { QueueItem } from "./schema";
import type { Profile } from "../profile/schema";

const profile: Profile = {
  incomes: [{ label: "Salary", monthly: 10000, variable: false }],
  fixedExpenses: [],
  avgVariableExpenses: [],
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

const planState = { strategyId: "fifty-thirty-twenty", params: {} };

function item(id: string, order: number): QueueItem {
  return {
    id,
    name: id,
    price: 2000,
    urgency: 2,
    importance: 2,
    isNeed: false,
    expectedUses: 10,
    addedDate: "2025-01-01",
    priceUpdatedDate: "2025-01-01",
    order,
  };
}

describe("scheduleQueue reordering", () => {
  it("is fully determined by input order: same order twice gives identical output", () => {
    const items = [item("a", 0), item("b", 1)];
    const run1 = scheduleQueue(items, profile, planState, [], "2026-01-01", "2026-01");
    const run2 = scheduleQueue(items, profile, planState, [], "2026-01-01", "2026-01");
    expect(run1).toEqual(run2);
  });

  it("changes at least one item's assigned month when the order changes", () => {
    const original = [item("a", 0), item("b", 1)];
    const reordered = [item("b", 0), item("a", 1)];

    const originalResult = scheduleQueue(original, profile, planState, [], "2026-01-01", "2026-01");
    const reorderedResult = scheduleQueue(
      reordered,
      profile,
      planState,
      [],
      "2026-01-01",
      "2026-01",
    );

    const originalMonths = new Map(originalResult.map((r) => [r.itemId, r.month]));
    const reorderedMonths = new Map(reorderedResult.map((r) => [r.itemId, r.month]));

    const changed = [...originalMonths.keys()].some(
      (id) => originalMonths.get(id) !== reorderedMonths.get(id),
    );
    expect(changed).toBe(true);
  });
});
