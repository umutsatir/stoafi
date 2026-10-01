import { describe, expect, it } from "vitest";
import { StoafiDb, SINGLETON_ID } from "./db";
import { exportToJson, importFromJson } from "./backup";

const validProfile = {
  incomes: [{ label: "Salary", monthly: 10000 }],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

const validCard = { id: "card-1", label: "Visa", statementDay: 15, dueDay: 5 };

describe("export/import round trip", () => {
  it("export -> clear data -> import restores everything", async () => {
    const db = new StoafiDb(`backup-test-${Math.random()}`);
    await db.open();

    await db.profile.put({ id: SINGLETON_ID, data: validProfile });
    await db.cards.put(validCard);
    await db.settings.put({ id: SINGLETON_ID, data: { locale: "tr", currency: "EUR" } });

    const json = await exportToJson(db, "2026-09-20T00:00:00.000Z");

    // clear data
    await db.profile.clear();
    await db.cards.clear();
    await db.settings.clear();
    expect(await db.profile.get(SINGLETON_ID)).toBeUndefined();
    expect(await db.cards.toArray()).toEqual([]);

    // import
    const result = await importFromJson(db, json);
    expect("data" in result).toBe(true);

    const profileRow = await db.profile.get(SINGLETON_ID);
    expect(profileRow?.data).toEqual(validProfile);

    const cards = await db.cards.toArray();
    expect(cards).toEqual([validCard]);

    const settingsRow = await db.settings.get(SINGLETON_ID);
    expect(settingsRow?.data).toEqual({ locale: "tr", currency: "EUR" });

    db.close();
  });

  it("returns errors and leaves tables untouched for a corrupted backup", async () => {
    const db = new StoafiDb(`backup-test-${Math.random()}`);
    await db.open();
    await db.cards.put(validCard);

    const corrupted = JSON.stringify({
      version: 1,
      exportedAt: "2026-09-20T00:00:00.000Z",
      data: { cards: [{ id: "bad", label: "Bad", statementDay: 99, dueDay: 5 }] },
    });

    const result = await importFromJson(db, corrupted);
    expect("errors" in result).toBe(true);

    // untouched: original card still present
    const cards = await db.cards.toArray();
    expect(cards).toEqual([validCard]);

    db.close();
  });
});
