import Dexie from "dexie";
import { describe, expect, it } from "vitest";
import { SINGLETON_ID, StoafiDb } from "./db";

describe("v1 -> v2 migration", () => {
  it("upgrades a v1 DB with existing data without losing it, and applies the v2 default", async () => {
    const dbName = `migration-test-${Math.random()}`;

    // Seed a v1-only database (no v2 definition), mirroring a real user's
    // existing data before the app ships the v2 code.
    const v1Only = new Dexie(dbName);
    v1Only.version(1).stores({
      profile: "id",
      plan: "id",
      guards: "id",
      queue: "id",
      sinkingFunds: "id",
      cards: "id",
      decisions: "id",
    });
    await v1Only.open();
    await v1Only.table("profile").put({ id: SINGLETON_ID, data: { savings: 5000 } });
    v1Only.close();

    // Now open with the app's current StoafiDb (v1 + v2), triggering the upgrade.
    const upgraded = new StoafiDb(dbName);
    await upgraded.open();

    const row = (await upgraded.profile.get(SINGLETON_ID)) as
      { id: string; data: unknown; note?: string | null } | undefined;
    expect(row?.data).toEqual({ savings: 5000 });
    expect(row?.note).toBeNull();

    upgraded.close();
  });
});
