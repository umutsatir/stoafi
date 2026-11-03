import { describe, expect, it } from "vitest";
import { hasDailyCopy, listCopies, loadHandle, saveCopy, saveHandle } from "./browser-copies";

describe("browser copies", () => {
  it("keeps one copy per day, the newest three, and one copy from before an import", async () => {
    for (const day of ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"]) {
      await saveCopy("daily", day, `{"day":"${day}"}`);
    }
    await saveCopy("beforeImport", "2026-11-04", '{"before":1}');
    await saveCopy("beforeImport", "2026-11-05", '{"before":2}');

    const copies = await listCopies();
    expect(copies.filter((c) => c.kind === "daily").map((c) => c.date)).toEqual([
      "2026-11-04",
      "2026-11-03",
      "2026-11-02",
    ]);
    expect(copies.filter((c) => c.kind === "beforeImport")).toHaveLength(1);
    expect(copies.find((c) => c.kind === "beforeImport")?.json).toBe('{"before":2}');
  });

  it("says whether today already has a daily copy", async () => {
    await saveCopy("daily", "2026-12-01", "{}");
    expect(await hasDailyCopy("2026-12-01")).toBe(true);
    expect(await hasDailyCopy("2026-12-02")).toBe(false);
  });

  it("remembers a backup file handle", async () => {
    await saveHandle({ name: "backup.json" });
    expect(await loadHandle<{ name: string }>()).toEqual({ name: "backup.json" });
  });
});
