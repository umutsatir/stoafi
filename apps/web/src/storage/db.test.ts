import { describe, expect, it } from "vitest";
import { StoafiDb } from "./db";

describe("StoafiDb", () => {
  it("opens with all expected tables", async () => {
    const db = new StoafiDb(`test-${Math.random()}`);
    await db.open();

    const tableNames = db.tables.map((t) => t.name).sort();
    expect(tableNames).toEqual(
      [
        "cards",
        "decisions",
        "guards",
        "holdings",
        "plan",
        "profile",
        "queue",
        "settings",
        "sinkingFunds",
        "snapshots",
      ].sort(),
    );

    db.close();
  });
});

describe("holdings table", () => {
  it("is added by version 5 without touching what was there", async () => {
    const name = `test-${Math.random()}`;
    const { default: Dexie } = await import("dexie");
    const old = new Dexie(name);
    old.version(40).stores({
      profile: "id",
      plan: "id",
      guards: "id",
      queue: "id",
      sinkingFunds: "id",
      cards: "id",
      decisions: "id",
      settings: "id",
    });
    await old.open();
    await old.table("cards").put({ id: "c", label: "Old", statementDay: 1, dueDay: 2 });
    old.close();

    const db = new StoafiDb(name);
    await db.open();
    expect(await db.cards.get("c")).toMatchObject({ label: "Old" });
    expect(await db.holdings.count()).toBe(0);
    db.close();
  });
});
