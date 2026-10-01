import { beforeEach, describe, expect, it } from "vitest";
import { buildDemoData, type DemoLabels } from "@/lib/demo-data";
import { StoafiDb } from "./db";
import { loadAppState } from "./bootstrap";
import { clearUserData, writeDemoData } from "./demo";

const labels = Object.fromEntries(
  [
    "salary",
    "rent",
    "car",
    "streaming",
    "headphones",
    "washer",
    "laptop",
    "phone",
    "insurance",
    "holiday",
    "gold",
    "fund",
    "card",
    "spouse",
    "jacket",
    "watch",
  ].map((k) => [k, k]),
) as unknown as DemoLabels;

let db: StoafiDb;
beforeEach(async () => {
  db = new StoafiDb(`demo-${Math.random()}`);
  await db.open();
});

describe("demo data storage", () => {
  it("writes the sample data so the app loads it like a real user's", async () => {
    await writeDemoData(db, buildDemoData("2026-10-15", labels));
    const state = await loadAppState(db);
    expect(state.profile?.incomes).toHaveLength(1);
    expect(state.queueItems).toHaveLength(4);
    expect(state.sinkingFunds).toHaveLength(2);
    expect(state.cards).toHaveLength(2);
    expect(state.holdings).toHaveLength(2);
    expect(state.decisions).toHaveLength(2);
  });

  it("replaces existing data instead of mixing with it", async () => {
    await db.queue.put({
      id: "mine",
      name: "Mine",
      price: 1,
      urgency: 1,
      importance: 1,
      isNeed: false,
      expectedUses: 1,
      addedDate: "2026-01-01",
      priceUpdatedDate: "2026-01-01",
      order: 0,
    });
    await writeDemoData(db, buildDemoData("2026-10-15", labels));
    expect(await db.queue.get("mine")).toBeUndefined();
    expect(await db.queue.count()).toBe(4);
  });

  it("can be loaded twice without duplicates", async () => {
    const data = buildDemoData("2026-10-15", labels);
    await writeDemoData(db, data);
    await writeDemoData(db, data);
    expect(await db.queue.count()).toBe(4);
    expect(await db.holdings.count()).toBe(2);
  });

  it("clears every kind of user data and leaves the settings alone", async () => {
    await writeDemoData(db, buildDemoData("2026-10-15", labels));
    await db.settings.put({
      id: "singleton",
      data: { locale: "tr", currency: "TRY", theme: "dark" },
    });
    await clearUserData(db);
    for (const table of [
      db.profile,
      db.plan,
      db.guards,
      db.queue,
      db.sinkingFunds,
      db.cards,
      db.decisions,
      db.holdings,
    ]) {
      expect(await table.count()).toBe(0);
    }
    expect(await db.settings.count()).toBe(1);
  });
});
