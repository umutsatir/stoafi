import { describe, expect, it } from "vitest";
import { scheduleQueue } from "./scheduler";
import type { QueueItem } from "./schema";
import type { Profile } from "../profile/schema";

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    incomes: [{ label: "Salary", monthly: 10000, variable: false }],
    fixedExpenses: [],
    avgVariableExpenses: [],
    savings: 0,
    emergencyFundTargetMonths: 6,
    annualInflationExpectation: 0.3,
    ...overrides,
  };
}

function makeItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: "item-1",
    name: "Item",
    price: 1000,
    urgency: 2,
    importance: 2,
    isNeed: false,
    expectedUses: 10,
    addedDate: "2025-01-01",
    priceUpdatedDate: "2025-01-01",
    order: 0,
    ...overrides,
  };
}

const planState = { strategyId: "fifty-thirty-twenty", params: {} };

describe("scheduleQueue", () => {
  it("schedules a single affordable item into the start month", () => {
    const item = makeItem({ id: "a", price: 1000 });
    const result = scheduleQueue([item], makeProfile(), planState, [], "2026-01-01", "2026-01");
    expect(result).toEqual([{ itemId: "a", month: "2026-01" }]);
  });

  it("returns month: null for an item that never fits within the horizon", () => {
    const item = makeItem({ id: "too-expensive", price: 100_000_000 });
    const result = scheduleQueue([item], makeProfile(), planState, [], "2026-01-01", "2026-01");
    expect(result).toEqual([{ itemId: "too-expensive", month: null }]);
  });

  it("does not schedule a want before its 30-day cooldown ends", () => {
    const item = makeItem({ id: "want-1", isNeed: false, addedDate: "2026-01-15", price: 1000 });
    const result = scheduleQueue([item], makeProfile(), planState, [], "2026-01-15", "2026-01");
    const scheduled = result[0];
    expect(scheduled?.month).not.toBe("2026-01");
  });

  it("schedules two items competing for the same bucket's room into different months, in queue order", () => {
    // wants limit for income 10000 at 30% = 3000; two items at 2000 each can't both fit in one month.
    const first = makeItem({ id: "first", price: 2000, order: 0 });
    const second = makeItem({ id: "second", price: 2000, order: 1 });
    const result = scheduleQueue(
      [first, second],
      makeProfile(),
      planState,
      [],
      "2026-01-01",
      "2026-01",
    );

    const firstResult = result.find((r) => r.itemId === "first");
    const secondResult = result.find((r) => r.itemId === "second");
    expect(firstResult?.month).toBe("2026-01");
    expect(secondResult?.month).not.toBe("2026-01");
    expect(secondResult?.month).not.toBeNull();
  });
});
