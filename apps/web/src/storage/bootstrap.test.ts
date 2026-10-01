import { describe, expect, it } from "vitest";
import { defaultPlanState } from "@stoafi/core";
import { StoafiDb } from "./db";
import { loadAppState } from "./bootstrap";

const profile = {
  incomes: [{ label: "Job", monthly: 5_000_000 }],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

function item(id: string, order: number) {
  return {
    id,
    name: id,
    price: 1_000,
    urgency: 1,
    importance: 1,
    isNeed: false,
    expectedUses: 1,
    addedDate: "2026-01-01",
    priceUpdatedDate: "2026-01-01",
    order,
  };
}

describe("loadAppState", () => {
  it("returns an empty state with the default plan for a fresh database", async () => {
    const db = new StoafiDb(`boot-${Math.random()}`);
    const state = await loadAppState(db);
    expect(state.profile).toBeNull();
    expect(state.planState).toEqual(defaultPlanState());
    expect(state.queueItems).toEqual([]);
    expect(state.decisions).toEqual([]);
    db.close();
  });

  it("loads saved rows and returns queue items in their saved order", async () => {
    const db = new StoafiDb(`boot-${Math.random()}`);
    await db.open();
    await db.profile.put({ id: "singleton", data: profile });
    await db.plan.put({
      id: "singleton",
      data: { strategyId: "pay-yourself-first", params: {} },
    });
    await db.queue.bulkPut([item("b", 1), item("a", 0), item("c", 2)]);

    const state = await loadAppState(db);
    expect(state.profile).toEqual(profile);
    expect(state.planState?.strategyId).toBe("pay-yourself-first");
    expect(state.queueItems.map((i) => i.id)).toEqual(["a", "b", "c"]);
    db.close();
  });

  it("ignores a stored profile that no longer validates instead of crashing the app", async () => {
    const db = new StoafiDb(`boot-${Math.random()}`);
    await db.open();
    await db.profile.put({ id: "singleton", data: { savings: -1 } });
    const state = await loadAppState(db);
    expect(state.profile).toBeNull();
    db.close();
  });

  it("defaults settings from the browser language on a fresh database", async () => {
    const db = new StoafiDb(`boot-${Math.random()}`);
    expect((await loadAppState(db, "tr-TR")).settings).toEqual({ locale: "tr", currency: "TRY" });
    expect((await loadAppState(db, "en-US")).settings).toEqual({ locale: "en", currency: "TRY" });
    db.close();
  });

  it("loads saved settings in preference to the browser language", async () => {
    const db = new StoafiDb(`boot-${Math.random()}`);
    await db.open();
    await db.settings.put({ id: "singleton", data: { locale: "en", currency: "EUR" } });
    const state = await loadAppState(db, "tr-TR");
    expect(state.settings).toEqual({ locale: "en", currency: "EUR" });
    db.close();
  });

  it("falls back to defaults when stored settings are invalid", async () => {
    const db = new StoafiDb(`boot-${Math.random()}`);
    await db.open();
    await db.settings.put({ id: "singleton", data: { locale: "klingon", currency: "TRY" } });
    const state = await loadAppState(db, "tr");
    expect(state.settings).toEqual({ locale: "tr", currency: "TRY" });
    db.close();
  });
});
