import { describe, expect, it } from "vitest";
import type { FileHandleLike } from "./auto-backup";
import {
  allowAutoBackup,
  currentStatus,
  disableAutoBackup,
  enableAutoBackup,
  writeToChosenFile,
  type AutoBackupDeps,
} from "./auto-backup-run";

function handleWith(permission: "granted" | "prompt", written: string[] = []): FileHandleLike {
  return {
    name: "f.json",
    createWritable: async () => ({
      write: async (d) => void written.push(d),
      close: async () => undefined,
    }),
    queryPermission: async () => permission,
    requestPermission: async () => "granted",
  };
}

function deps(over: Partial<AutoBackupDeps> = {}, stored: FileHandleLike | null = null) {
  let current = stored;
  const d: AutoBackupDeps = {
    supported: () => true,
    load: async () => current,
    save: async (h) => void (current = h),
    forget: async () => void (current = null),
    choose: async () => handleWith("granted"),
    ...over,
  };
  return d;
}

describe("currentStatus", () => {
  it("says unsupported, off, needs-permission or on", async () => {
    expect(await currentStatus(deps({ supported: () => false }))).toBe("unsupported");
    expect(await currentStatus(deps())).toBe("off");
    expect(await currentStatus(deps({}, handleWith("prompt")))).toBe("needs-permission");
    expect(await currentStatus(deps({}, handleWith("granted")))).toBe("on");
  });
});

describe("enable, allow and disable", () => {
  it("remembers the file the user picked and turns on", async () => {
    const d = deps();
    expect(await enableAutoBackup(d)).toBe("on");
    expect(await currentStatus(d)).toBe("on");
  });

  it("stays as it was when the user closes the picker, or the browser cannot do it", async () => {
    expect(await enableAutoBackup(deps({ choose: async () => null }))).toBe("off");
    expect(await enableAutoBackup(deps({ supported: () => false }))).toBe("unsupported");
  });

  it("asks for permission again on a remembered file", async () => {
    expect(await allowAutoBackup(deps({}, handleWith("prompt")))).toBe("on");
    expect(await allowAutoBackup(deps())).toBe("off");
  });

  it("forgets the file", async () => {
    const d = deps({}, handleWith("granted"));
    await disableAutoBackup(d);
    expect(await currentStatus(d)).toBe("off");
  });
});

describe("writeToChosenFile", () => {
  it("writes into the remembered file", async () => {
    const written: string[] = [];
    expect(await writeToChosenFile("{}", deps({}, handleWith("granted", written)))).toBe("written");
    expect(written).toEqual(["{}"]);
  });

  it("does nothing without a file or without browser support, and says when permission is needed", async () => {
    expect(await writeToChosenFile("{}", deps())).toBe("off");
    expect(await writeToChosenFile("{}", deps({ supported: () => false }))).toBe("off");
    expect(await writeToChosenFile("{}", deps({}, handleWith("prompt")))).toBe("needs-permission");
  });
});
