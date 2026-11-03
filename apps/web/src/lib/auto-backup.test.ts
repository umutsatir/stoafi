import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it, vi } from "vitest";
import {
  chooseBackupFile,
  forgetHandle,
  handlePermission,
  loadHandle,
  reGrant,
  saveHandle,
  supportsFileBackup,
  writeBackup,
  type FileHandleLike,
} from "./auto-backup";

function fakeHandle(permission: "granted" | "denied" | "prompt" = "granted") {
  const written: string[] = [];
  const handle: FileHandleLike = {
    name: "stoafi-backup.json",
    createWritable: async () => ({
      write: async (data) => void written.push(data),
      close: async () => undefined,
    }),
    queryPermission: async () => permission,
    requestPermission: async () => "granted",
  };
  return { handle, written };
}

describe("supportsFileBackup", () => {
  it("is true only where the browser has a save-file picker", () => {
    expect(supportsFileBackup({})).toBe(false);
    expect(supportsFileBackup(undefined)).toBe(false);
    expect(supportsFileBackup({ showSaveFilePicker: async () => fakeHandle().handle })).toBe(true);
  });
});

describe("chooseBackupFile", () => {
  it("returns the file the user picked, with a JSON suggestion", async () => {
    const { handle } = fakeHandle();
    const picker = vi.fn(async (options: unknown) => (options ? handle : handle));
    expect(await chooseBackupFile({ showSaveFilePicker: picker })).toBe(handle);
    expect(picker.mock.calls[0]?.[0]).toMatchObject({ suggestedName: "stoafi-backup.json" });
  });

  it("returns null when the user closes the picker or the browser has none", async () => {
    const cancelled = async () => {
      throw new DOMException("closed", "AbortError");
    };
    expect(await chooseBackupFile({ showSaveFilePicker: cancelled })).toBeNull();
    expect(await chooseBackupFile({})).toBeNull();
  });
});

describe("writeBackup", () => {
  it("replaces the file's contents when permission is there", async () => {
    const { handle, written } = fakeHandle("granted");
    expect(await writeBackup(handle, '{"a":1}')).toBe("written");
    expect(written).toEqual(['{"a":1}']);
  });

  it("does not write, and says why, when the browser needs asking again", async () => {
    const { handle, written } = fakeHandle("prompt");
    expect(await writeBackup(handle, "{}")).toBe("needs-permission");
    expect(written).toEqual([]);
  });

  it("reports a failed write instead of throwing", async () => {
    const { handle } = fakeHandle("granted");
    handle.createWritable = async () => {
      throw new Error("disk full");
    };
    expect(await writeBackup(handle, "{}")).toBe("failed");
  });
});

describe("permission", () => {
  it("reads the current permission, and treats an error as needing permission", async () => {
    expect(await handlePermission(fakeHandle("granted").handle)).toBe("granted");
    expect(await handlePermission(fakeHandle("denied").handle)).toBe("needs-permission");
    const broken = fakeHandle().handle;
    broken.queryPermission = async () => {
      throw new Error("x");
    };
    expect(await handlePermission(broken)).toBe("needs-permission");
  });

  it("asks again on request", async () => {
    expect(await reGrant(fakeHandle("prompt").handle)).toBe(true);
    const broken = fakeHandle().handle;
    broken.requestPermission = async () => {
      throw new Error("x");
    };
    expect(await reGrant(broken)).toBe(false);
  });
});

describe("the remembered file", () => {
  it("is saved, loaded and forgotten", async () => {
    const factory = new IDBFactory();
    expect(await loadHandle(factory)).toBeNull();
    // fake-indexeddb clones values, so a plain object stands in for the browser's handle
    await saveHandle({ name: "x.json" } as unknown as FileHandleLike, factory);
    expect((await loadHandle(factory))?.name).toBe("x.json");
    await forgetHandle(factory);
    expect(await loadHandle(factory)).toBeNull();
  });
});
