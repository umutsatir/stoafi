import { beforeEach, describe, expect, it } from "vitest";
import backupV1 from "./fixtures/backup-v1.json";
import { importFromJson } from "./backup";
import { loadAppState } from "./bootstrap";
import { StoafiDb } from "./db";

let db: StoafiDb;
beforeEach(async () => {
  db = new StoafiDb(`old-${Math.random()}`);
  await db.open();
});

describe("a backup from the first version of the app", () => {
  it("imports, and the app then loads everything from it", async () => {
    const result = await importFromJson(db, JSON.stringify(backupV1));
    expect("errors" in result).toBe(false);

    const state = await loadAppState(db);
    // The old "variable expenses" are folded into one living-costs line.
    expect(state.profile).toMatchObject({
      incomes: [{ label: "Salary", monthly: 5_000_000 }],
      livingExpenses: 900_000,
      savings: 2_000_000,
    });
    expect(state.planState.strategyId).toBe("fifty-thirty-twenty");
    expect(state.queueItems.map((i) => i.name)).toEqual(["Headphones"]);
    expect(state.sinkingFunds[0]?.currentBalance).toBe(100_000);
    expect(state.cards[0]).toMatchObject({ label: "Visa", statementDay: 15 });
    expect(state.decisions).toHaveLength(1);
    expect(state.settings).toMatchObject({ locale: "en", currency: "TRY" });
    // Tables that did not exist then are simply empty.
    expect(state.holdings).toEqual([]);
    expect(state.snapshots).toEqual([]);
  });

  it("leaves the existing data alone when the backup is damaged", async () => {
    await db.cards.put({ id: "mine", label: "Mine", statementDay: 1, dueDay: 2 });
    const broken = { ...backupV1, data: { ...backupV1.data, cards: [{ id: "c1", label: 5 }] } };
    const result = await importFromJson(db, JSON.stringify(broken));
    expect("errors" in result).toBe(true);
    expect(await db.cards.get("mine")).toBeDefined();
  });
});

describe("every stored version opens in the current app", () => {
  it.each([
    [
      "version 1",
      {
        stores: {
          profile: "id",
          plan: "id",
          guards: "id",
          queue: "id",
          sinkingFunds: "id",
          cards: "id",
          decisions: "id",
        },
        version: 10,
      },
    ],
    [
      "version 4",
      {
        stores: {
          profile: "id",
          plan: "id",
          guards: "id",
          queue: "id",
          sinkingFunds: "id",
          cards: "id",
          decisions: "id",
          settings: "id",
        },
        version: 40,
      },
    ],
    [
      "version 5",
      {
        stores: {
          profile: "id",
          plan: "id",
          guards: "id",
          queue: "id",
          sinkingFunds: "id",
          cards: "id",
          decisions: "id",
          settings: "id",
          holdings: "id",
        },
        version: 50,
      },
    ],
  ])("%s keeps its rows and gains the newer tables", async (_name, { stores, version }) => {
    const name = `ver-${Math.random()}`;
    const { default: Dexie } = await import("dexie");
    const old = new Dexie(name);
    old.version(version).stores(stores);
    await old.open();
    await old.table("queue").put({
      id: "q",
      name: "Old item",
      price: 100,
      urgency: 1,
      importance: 1,
      isNeed: false,
      expectedUses: 1,
      addedDate: "2025-01-01",
      priceUpdatedDate: "2025-01-01",
      order: 0,
    });
    old.close();

    const current = new StoafiDb(name);
    await current.open();
    expect(await current.queue.get("q")).toMatchObject({ name: "Old item" });
    expect(await current.holdings.count()).toBe(0);
    expect(await current.snapshots.count()).toBe(0);
    const state = await loadAppState(current);
    expect(state.queueItems).toHaveLength(1);
    current.close();
  });
});
