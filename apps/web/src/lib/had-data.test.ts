import { describe, expect, it } from "vitest";
import { dataLooksLost, dataSince, forgetData, rememberData } from "./had-data";

function memory(): Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

describe("had-data mark", () => {
  it("remembers the first day there was data, not later ones", () => {
    const s = memory();
    expect(dataSince(s)).toBeNull();
    rememberData("2026-10-01", s);
    rememberData("2026-10-09", s);
    expect(dataSince(s)).toBe("2026-10-01");
  });

  it("calls data lost only when there was data and now there is none", () => {
    const s = memory();
    expect(dataLooksLost(false, s)).toBe(false); // a brand-new device
    rememberData("2026-10-01", s);
    expect(dataLooksLost(false, s)).toBe(true);
    expect(dataLooksLost(true, s)).toBe(false);
  });

  it("does not call it lost after the user emptied the data on purpose", () => {
    const s = memory();
    rememberData("2026-10-01", s);
    forgetData(s);
    expect(dataLooksLost(false, s)).toBe(false);
  });

  it("copes with storage that throws or is missing", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() => rememberData("2026-10-01", broken)).not.toThrow();
    expect(dataSince(broken)).toBeNull();
    expect(() => forgetData(broken)).not.toThrow();
    expect(dataLooksLost(false, broken)).toBe(false);
    expect(dataSince(undefined)).toBeNull();
  });
});
