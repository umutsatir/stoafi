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

describe("importWithSafetyCopy", () => {
  it("keeps what was there before a file replaces it, and restoring that copy brings it back", async () => {
    const { StoafiDb } = await import("./db");
    const { importWithSafetyCopy, exportToJson, importFromJson } = await import("./backup");
    const { readCopy } = await import("./internal-backup");
    const db = new StoafiDb(`safety-${Math.random()}`);
    const profile = {
      incomes: [{ label: "Job", monthly: 1_000_000 }],
      fixedExpenses: [],
      livingExpenses: 0,
      savings: 0,
      emergencyFundTargetMonths: 6,
      annualInflationExpectation: 0.3,
    };
    await db.profile.put({ id: "singleton", data: profile });
    const before = await exportToJson(db, "2026-10-05T08:00:00.000Z");

    // a file with a different income
    await db.profile.put({ id: "singleton", data: { ...profile, savings: 5 } });
    const other = await exportToJson(db, "2026-10-05T09:00:00.000Z");
    await db.profile.put({ id: "singleton", data: profile });

    const result = await importWithSafetyCopy(db, other, "2026-10-05T10:00:00.000Z");
    expect("errors" in result).toBe(false);
    expect(((await db.profile.get("singleton"))?.data as { savings: number }).savings).toBe(5);

    const copy = await readCopy(db, "before-import");
    expect(copy).not.toBeNull();
    await importFromJson(db, copy as string);
    expect(((await db.profile.get("singleton"))?.data as { savings: number }).savings).toBe(0);
    expect(before.length).toBeGreaterThan(0);
  });

  it("changes nothing, and keeps no copy, when the file is not a valid backup", async () => {
    const { StoafiDb } = await import("./db");
    const { importWithSafetyCopy } = await import("./backup");
    const { listCopies } = await import("./internal-backup");
    const db = new StoafiDb(`safety-${Math.random()}`);
    const result = await importWithSafetyCopy(
      db,
      JSON.stringify({ nope: true }),
      "2026-10-05T10:00:00.000Z",
    );
    expect("errors" in result).toBe(true);
    expect(await listCopies(db)).toEqual([]);
  });
});
