import { describe, expect, it } from "vitest";
import type { Card } from "@stoafi/core";
import { StoafiDb } from "./db";
import { loadAppState } from "./bootstrap";
import { removeCard, saveCard } from "./card-repo";

const card: Card = { id: "visa", label: "Visa", statementDay: 15, dueDay: 5 };

describe("card repo", () => {
  it("saves a card and loads it back", async () => {
    const db = new StoafiDb(`card-${Math.random()}`);
    await saveCard(db, card);
    expect((await loadAppState(db)).cards).toEqual([card]);
    db.close();
  });

  it("removes a card", async () => {
    const db = new StoafiDb(`card-${Math.random()}`);
    await saveCard(db, card);
    await removeCard(db, "visa");
    expect((await loadAppState(db)).cards).toEqual([]);
    db.close();
  });

  it("rejects an impossible statement day before writing", async () => {
    const db = new StoafiDb(`card-${Math.random()}`);
    await expect(saveCard(db, { ...card, statementDay: 40 })).rejects.toThrow();
    expect(await db.cards.count()).toBe(0);
    db.close();
  });
});
