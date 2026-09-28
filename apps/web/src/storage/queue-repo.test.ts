import { describe, expect, it } from "vitest";
import type { QueueItem } from "@stoafi/core";
import { StoafiDb } from "./db";
import { removeQueueItem, saveQueueItem, saveQueueOrder } from "./queue-repo";
import { loadAppState } from "./bootstrap";

function item(id: string, order: number): QueueItem {
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

describe("queue repo", () => {
  it("saves and reloads an item, replacing it on edit", async () => {
    const db = new StoafiDb(`q-${Math.random()}`);
    await saveQueueItem(db, item("a", 0));
    await saveQueueItem(db, { ...item("a", 0), name: "renamed" });
    const { queueItems } = await loadAppState(db);
    expect(queueItems.map((i) => i.name)).toEqual(["renamed"]);
    db.close();
  });

  it("removes an item", async () => {
    const db = new StoafiDb(`q-${Math.random()}`);
    await saveQueueItem(db, item("a", 0));
    await saveQueueItem(db, item("b", 1));
    await removeQueueItem(db, "a");
    const { queueItems } = await loadAppState(db);
    expect(queueItems.map((i) => i.id)).toEqual(["b"]);
    db.close();
  });

  it("persists a new order so a reload keeps it", async () => {
    const db = new StoafiDb(`q-${Math.random()}`);
    await saveQueueItem(db, item("a", 0));
    await saveQueueItem(db, item("b", 1));
    await saveQueueOrder(db, [item("b", 0), item("a", 1)]);
    const { queueItems } = await loadAppState(db);
    expect(queueItems.map((i) => i.id)).toEqual(["b", "a"]);
    db.close();
  });

  it("rejects an invalid item before writing", async () => {
    const db = new StoafiDb(`q-${Math.random()}`);
    await expect(saveQueueItem(db, { ...item("a", 0), urgency: 9 })).rejects.toThrow();
    expect(await db.queue.count()).toBe(0);
    db.close();
  });
});
