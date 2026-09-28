import { describe, expect, it } from "vitest";
import { createRegistry } from "../../kernel/registry";
import { profileModule } from "../profile/module";
import { queueModule } from "../queue/module";
import { importAll } from "./import";

function registry() {
  const r = createRegistry();
  r.register(profileModule);
  r.register(queueModule);
  return r;
}

const validProfile = {
  incomes: [{ label: "Salary", monthly: 10000 }],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

describe("importAll", () => {
  it("imports a fully valid backup", () => {
    const backup = {
      version: 1,
      exportedAt: "2026-09-20T00:00:00.000Z",
      data: { profile: [validProfile], queue: [] },
    };

    const result = importAll(registry(), backup);
    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data.profile).toHaveLength(1);
    }
  });

  it("collects errors naming the corrupted module while a valid module still imports", () => {
    const backup = {
      version: 1,
      exportedAt: "2026-09-20T00:00:00.000Z",
      data: {
        profile: [{ ...validProfile, savings: -1 }], // invalid: negative savings
        queue: [],
      },
    };

    const result = importAll(registry(), backup);
    expect("errors" in result).toBe(true);
    if ("errors" in result) {
      expect(result.errors.some((e) => e.includes("profile"))).toBe(true);
    }
  });

  it("ignores an unknown module id present in the backup rather than failing the whole import", () => {
    const backup = {
      version: 1,
      exportedAt: "2026-09-20T00:00:00.000Z",
      data: { profile: [validProfile], "some-future-module": [{ anything: true }] },
    };

    const result = importAll(registry(), backup);
    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data["some-future-module"]).toBeUndefined();
      expect(result.data.profile).toHaveLength(1);
    }
  });

  it("returns errors for a backup that fails the outer BackupSchema", () => {
    const result = importAll(registry(), { not: "a backup" });
    expect("errors" in result).toBe(true);
  });
});
