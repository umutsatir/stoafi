import { describe, expect, it, vi } from "vitest";
import { persistState, requestPersistence } from "./persist-storage";

describe("persistState", () => {
  it("is unsupported when the browser has no storage manager", async () => {
    expect(await persistState(undefined)).toBe("unsupported");
    expect(await persistState({})).toBe("unsupported");
  });

  it("reports whether the data is protected", async () => {
    const yes = { persisted: async () => true, persist: async () => true };
    const no = { persisted: async () => false, persist: async () => false };
    expect(await persistState(yes)).toBe("persisted");
    expect(await persistState(no)).toBe("not-persisted");
  });

  it("treats a browser that throws as unsupported", async () => {
    const broken = {
      persisted: async () => {
        throw new Error("nope");
      },
      persist: async () => true,
    };
    expect(await persistState(broken)).toBe("unsupported");
  });
});

describe("requestPersistence", () => {
  it("asks only when the data is not protected yet, and reports the answer", async () => {
    const persist = vi.fn(async () => true);
    expect(await requestPersistence({ persisted: async () => false, persist })).toBe("persisted");
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("does not ask again when already protected", async () => {
    const persist = vi.fn(async () => true);
    expect(await requestPersistence({ persisted: async () => true, persist })).toBe("persisted");
    expect(persist).not.toHaveBeenCalled();
  });

  it("says so when the browser refuses or fails", async () => {
    expect(
      await requestPersistence({ persisted: async () => false, persist: async () => false }),
    ).toBe("not-persisted");
    expect(
      await requestPersistence({
        persisted: async () => false,
        persist: async () => {
          throw new Error("x");
        },
      }),
    ).toBe("not-persisted");
  });
});
