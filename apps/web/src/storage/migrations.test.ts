import Dexie from "dexie";
import { describe, expect, it } from "vitest";
import { ProfileSchema } from "@stoafi/core";
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

describe("v2 -> v3 migration", () => {
  it("rewrites a stored v1-shaped profile so it validates against the current ProfileSchema", async () => {
    const dbName = `migration-test-${Math.random()}`;
    const stores = {
      profile: "id",
      plan: "id",
      guards: "id",
      queue: "id",
      sinkingFunds: "id",
      cards: "id",
      decisions: "id",
    };
    const v2Only = new Dexie(dbName);
    v2Only.version(1).stores(stores);
    v2Only.version(2).stores(stores);
    await v2Only.open();
    await v2Only.table("profile").put({
      id: SINGLETON_ID,
      note: null,
      data: {
        incomes: [{ label: "Salary", monthly: 50000, variable: false }],
        fixedExpenses: [],
        avgVariableExpenses: [{ label: "Groceries", monthly: 9000, bucket: "needs" }],
        savings: 0,
        emergencyFundTargetMonths: 6,
        annualInflationExpectation: 0.3,
      },
    });
    v2Only.close();

    const upgraded = new StoafiDb(dbName);
    await upgraded.open();
    const row = await upgraded.profile.get(SINGLETON_ID);
    const profile = ProfileSchema.parse(row?.data);
    expect(profile.livingExpenses).toBe(9000);
    expect(profile.incomes).toEqual([{ label: "Salary", monthly: 50000 }]);
    upgraded.close();
  });
});
