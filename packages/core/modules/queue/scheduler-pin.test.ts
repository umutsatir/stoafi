import { describe, expect, it } from "vitest";
import { scheduleQueue } from "./scheduler";
import type { QueueItem } from "./schema";
import type { Profile } from "../profile/schema";

const profile: Profile = {
  incomes: [{ label: "Salary", monthly: 10000 }],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};
const planState = { strategyId: "fifty-thirty-twenty", params: {} };

function item(overrides: Partial<QueueItem>): QueueItem {
  return {
    id: "item",
    name: "Item",
    price: 1000,
    urgency: 2,
    importance: 2,
    isNeed: true,
    expectedUses: 10,
    addedDate: "2025-01-01",
    priceUpdatedDate: "2025-01-01",
    order: 0,
    ...overrides,
  };
}

describe("scheduleQueue with a pinned month", () => {
  it("places an item in the month the user pinned it to, not the earliest that fits", () => {
    const pinned = item({ id: "pinned", pinnedMonth: "2026-04" });
    const result = scheduleQueue([pinned], profile, planState, [], "2026-01-01", "2026-01");
    expect(result).toEqual([{ itemId: "pinned", month: "2026-04" }]);
  });

  it("keeps the pin even when the month has no room, because the user chose it", () => {
    const pinned = item({ id: "big", price: 100_000_000, pinnedMonth: "2026-03" });
    const result = scheduleQueue([pinned], profile, planState, [], "2026-01-01", "2026-01");
    expect(result[0]?.month).toBe("2026-03");
  });

  it("makes later items work around the pinned one", () => {
    // needs limit at 50% of 10000 = 5000: the pinned 4000 takes April, so a 2000 item cannot join it.
    const pinned = item({ id: "pinned", price: 4000, pinnedMonth: "2026-04", order: 0 });
    const other = item({ id: "other", price: 2000, order: 1 });
    const result = scheduleQueue([pinned, other], profile, planState, [], "2026-01-01", "2026-04");
    expect(result.find((r) => r.itemId === "pinned")?.month).toBe("2026-04");
    expect(result.find((r) => r.itemId === "other")?.month).not.toBe("2026-04");
  });

  it("ignores a pin that is in the past or outside the horizon and schedules as usual", () => {
    const past = item({ id: "past", pinnedMonth: "2025-06" });
    const far = item({ id: "far", pinnedMonth: "2028-01", order: 1 });
    const result = scheduleQueue([past, far], profile, planState, [], "2026-01-01", "2026-01");
    expect(result.find((r) => r.itemId === "past")?.month).toBe("2026-01");
    expect(result.find((r) => r.itemId === "far")?.month).not.toBe("2028-01");
  });
});
