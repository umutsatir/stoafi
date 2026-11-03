import { beforeEach, describe, expect, it } from "vitest";
import { StoafiDb } from "./db";
import {
  KEEP_DAILY_COPIES,
  clearCopies,
  listCopies,
  readCopy,
  saveBeforeImport,
  saveDailyCopy,
} from "./internal-backup";

let db: StoafiDb;
beforeEach(() => {
  db = new StoafiDb(`internal-${Math.random()}`);
});

describe("daily internal copies", () => {
  it("keeps one copy per day, the first of the day", async () => {
    await saveDailyCopy(db, "2026-10-05", '{"a":1}', "2026-10-05T08:00:00.000Z");
    await saveDailyCopy(db, "2026-10-05", '{"a":2}', "2026-10-05T20:00:00.000Z");
    expect(await readCopy(db, "2026-10-05")).toBe('{"a":1}');
    expect(await listCopies(db)).toHaveLength(1);
  });

  it("keeps only the newest few days", async () => {
    for (const day of ["01", "02", "03", "04", "05"]) {
      await saveDailyCopy(db, `2026-10-${day}`, "{}", `2026-10-${day}T08:00:00.000Z`);
    }
    const ids = (await listCopies(db)).map((c) => c.id);
    expect(ids).toEqual(["2026-10-05", "2026-10-04", "2026-10-03"]);
    expect(ids).toHaveLength(KEEP_DAILY_COPIES);
  });
});

describe("the copy before an import", () => {
  it("is listed first, replaced by the next import, and not counted among the daily ones", async () => {
    for (const day of ["01", "02", "03"]) {
      await saveDailyCopy(db, `2026-10-${day}`, "{}", `2026-10-${day}T08:00:00.000Z`);
    }
    await saveBeforeImport(db, '{"x":1}', "2026-10-04T08:00:00.000Z");
    await saveBeforeImport(db, '{"x":2}', "2026-10-04T09:00:00.000Z");
    await saveDailyCopy(db, "2026-10-04", "{}", "2026-10-04T10:00:00.000Z");
    const list = await listCopies(db);
    expect(list[0]).toMatchObject({ id: "before-import", beforeImport: true });
    expect(await readCopy(db, "before-import")).toBe('{"x":2}');
    expect(list.filter((c) => !c.beforeImport)).toHaveLength(3);
  });
});

describe("reading and clearing", () => {
  it("returns null for a copy that is not there, and clears everything", async () => {
    expect(await readCopy(db, "2020-01-01")).toBeNull();
    await saveDailyCopy(db, "2026-10-05", "{}", "2026-10-05T08:00:00.000Z");
    await clearCopies(db);
    expect(await listCopies(db)).toEqual([]);
  });
});
