import { describe, expect, it } from "vitest";
import type { SinkingFund } from "@stoafi/core";
import { StoafiDb } from "./db";
import { loadAppState } from "./bootstrap";
import { removeSinkingFund, saveSinkingFund } from "./sinking-repo";

const fund: SinkingFund = {
  id: "f1",
  label: "Insurance",
  target: 600_000,
  dueMonth: "2027-03",
  currentBalance: 100_000,
};

describe("sinking fund repo", () => {
  it("saves a fund, replaces it on edit and loads it back", async () => {
    const db = new StoafiDb(`sf-${Math.random()}`);
    await saveSinkingFund(db, fund);
    await saveSinkingFund(db, { ...fund, currentBalance: 250_000 });
    const { sinkingFunds } = await loadAppState(db);
    expect(sinkingFunds).toEqual([{ ...fund, currentBalance: 250_000 }]);
    db.close();
  });

  it("removes a fund", async () => {
    const db = new StoafiDb(`sf-${Math.random()}`);
    await saveSinkingFund(db, fund);
    await removeSinkingFund(db, "f1");
    expect((await loadAppState(db)).sinkingFunds).toEqual([]);
    db.close();
  });

  it("rejects an invalid fund before writing", async () => {
    const db = new StoafiDb(`sf-${Math.random()}`);
    await expect(
      saveSinkingFund(db, { ...fund, dueMonth: "next spring" as never }),
    ).rejects.toThrow();
    expect(await db.sinkingFunds.count()).toBe(0);
    db.close();
  });
});
