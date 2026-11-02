import { describe, expect, it } from "vitest";
import { clearHadData, hadData, markHadData } from "./had-data";

function memory(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, v),
  };
}

describe("had-data mirror", () => {
  it("is false until the browser has held data", () => {
    expect(hadData(memory())).toBe(false);
  });

  it("remembers that data was held, and forgets when asked", () => {
    const store = memory();
    markHadData(store);
    expect(hadData(store)).toBe(true);
    clearHadData(store);
    expect(hadData(store)).toBe(false);
  });

  it("treats blocked storage as no data instead of throwing", () => {
    const blocked = {
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
    expect(hadData(blocked)).toBe(false);
    expect(() => markHadData(blocked)).not.toThrow();
    expect(() => clearHadData(blocked)).not.toThrow();
  });
});
