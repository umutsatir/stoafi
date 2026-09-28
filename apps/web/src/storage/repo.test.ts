import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { StoafiDb } from "./db";
import { getSingleton, listItems, putListItem, putSingleton } from "./repo";

const ProfileSchema = z.object({
  incomes: z.array(z.unknown()),
  savings: z.number().int().nonnegative(),
});

const QueueItemSchema = z.object({
  id: z.string(),
  name: z.string(),
});

describe("putSingleton / getSingleton", () => {
  it("writes a valid profile and reads it back", async () => {
    const db = new StoafiDb(`test-${Math.random()}`);
    await db.open();

    await putSingleton(db, "profile", ProfileSchema, { incomes: [], savings: 1000 });
    const result = await getSingleton(db, "profile", ProfileSchema);

    expect(result).toEqual({ incomes: [], savings: 1000 });
    db.close();
  });

  it("throws before any Dexie call when the value is invalid", async () => {
    const db = new StoafiDb(`test-${Math.random()}`);
    await db.open();
    const putSpy = vi.spyOn(db.profile, "put");

    await expect(
      putSingleton(db, "profile", ProfileSchema, { incomes: [], savings: -1 }),
    ).rejects.toThrow();

    expect(putSpy).not.toHaveBeenCalled();
    db.close();
  });
});

describe("putListItem / listItems", () => {
  it("writes and lists valid queue items", async () => {
    const db = new StoafiDb(`test-${Math.random()}`);
    await db.open();

    await putListItem(db, "queue", QueueItemSchema, { id: "a", name: "Laptop" });
    const items = await listItems(db, "queue", QueueItemSchema);

    expect(items).toEqual([{ id: "a", name: "Laptop" }]);
    db.close();
  });
});
