import { describe, expect, it } from "vitest";
import { StoafiDb } from "./db";

describe("StoafiDb", () => {
  it("opens with all expected tables at version 1", async () => {
    const db = new StoafiDb(`test-${Math.random()}`);
    await db.open();

    const tableNames = db.tables.map((t) => t.name).sort();
    expect(tableNames).toEqual(
      ["cards", "decisions", "guards", "plan", "profile", "queue", "sinkingFunds"].sort(),
    );
    expect(db.verno).toBe(1);

    db.close();
  });
});
