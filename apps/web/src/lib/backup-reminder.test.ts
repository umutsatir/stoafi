import { describe, expect, it } from "vitest";
import { BACKUP_REMINDER_DAYS, backupDue, daysSinceBackup } from "./backup-reminder";

describe("daysSinceBackup", () => {
  it("counts days, and is null when there was never a backup", () => {
    expect(daysSinceBackup("2026-09-01", "2026-10-01")).toBe(30);
    expect(daysSinceBackup("2026-10-01", "2026-10-01")).toBe(0);
    expect(daysSinceBackup(null, "2026-10-01")).toBeNull();
  });

  it("is never negative for a date in the future", () => {
    expect(daysSinceBackup("2026-11-01", "2026-10-01")).toBe(0);
  });
});

describe("backupDue", () => {
  it("does not ask when there is nothing to back up", () => {
    expect(backupDue(null, "2026-10-01", false, null)).toBe(false);
  });

  it("asks once the last backup is a month old, and not a day sooner", () => {
    expect(BACKUP_REMINDER_DAYS).toBe(30);
    expect(backupDue("2026-09-01", "2026-10-01", true, "2026-01-01")).toBe(true);
    expect(backupDue("2026-09-02", "2026-10-01", true, "2026-01-01")).toBe(false);
  });

  it("gives a new user a month before asking, if they never backed up", () => {
    expect(backupDue(null, "2026-10-01", true, "2026-09-20")).toBe(false);
    expect(backupDue(null, "2026-10-01", true, "2026-09-01")).toBe(true);
  });

  it("does not ask when the start of the data is unknown", () => {
    expect(backupDue(null, "2026-10-01", true, null)).toBe(false);
  });
});
