import { describe, expect, it } from "vitest";
import { createRegistry } from "../../kernel/registry";
import { profileModule } from "../profile/module";
import { queueModule } from "../queue/module";
import { BackupSchema, exportAll } from "./schema";

describe("exportAll", () => {
  it("produces an object validating against BackupSchema", () => {
    const registry = createRegistry();
    registry.register(profileModule);
    registry.register(queueModule);

    const snapshot = {
      profile: [{ incomes: [], fixedExpenses: [], livingExpenses: 0 }],
      queue: [],
    };

    const backup = exportAll(registry, snapshot, "2026-09-20T00:00:00.000Z");
    expect(BackupSchema.safeParse(backup).success).toBe(true);
  });

  it("survives a JSON stringify/parse round trip and still validates", () => {
    const registry = createRegistry();
    registry.register(profileModule);

    const snapshot = { profile: [{ savings: 1000 }] };
    const backup = exportAll(registry, snapshot, "2026-09-20T00:00:00.000Z");

    const roundTripped: unknown = JSON.parse(JSON.stringify(backup));
    expect(BackupSchema.safeParse(roundTripped).success).toBe(true);
  });
});
