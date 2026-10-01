import { describe, expect, it } from "vitest";
import { createLock, isValidPin, verifyPin } from "./pin";

describe("isValidPin", () => {
  it("accepts four to eight digits only", () => {
    for (const ok of ["1234", "123456", "12345678"]) expect(isValidPin(ok)).toBe(true);
    for (const bad of ["", "123", "123456789", "12a4", " 1234", "12 34", "１２３４"]) {
      expect(isValidPin(bad)).toBe(false);
    }
  });
});

describe("the PIN lock", () => {
  it("accepts the right PIN and refuses a wrong one", async () => {
    const lock = await createLock("4821");
    expect(await verifyPin("4821", lock)).toBe(true);
    expect(await verifyPin("4822", lock)).toBe(false);
    expect(await verifyPin("48210", lock)).toBe(false);
  });

  it("never stores the PIN, and gives each lock its own salt", async () => {
    const a = await createLock("4821");
    const b = await createLock("4821");
    expect(JSON.stringify(a)).not.toContain("4821");
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("refuses a PIN of the wrong shape without checking it", async () => {
    const lock = await createLock("4821");
    expect(await verifyPin("", lock)).toBe(false);
    expect(await verifyPin("abcd", lock)).toBe(false);
  });

  it("refuses against a lock that was damaged", async () => {
    const lock = await createLock("4821");
    expect(await verifyPin("4821", { ...lock, hash: lock.hash.slice(0, 10) })).toBe(false);
  });
});
