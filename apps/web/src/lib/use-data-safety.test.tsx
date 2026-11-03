import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";

const mocks = vi.hoisted(() => ({
  write: vi.fn<(json: string) => Promise<"written" | "needs-permission">>(async () => "written"),
  status: vi.fn(async () => "on" as const),
}));
vi.mock("@/lib/auto-backup-run", () => ({
  writeToChosenFile: mocks.write,
  currentStatus: mocks.status,
}));

import { backupToFileNow, useDataSafety } from "./use-data-safety";

const profile = {
  incomes: [{ label: "Job", monthly: 100_000 }],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

beforeEach(async () => {
  vi.clearAllMocks();
  await db.profile.clear();
  await db.backups.clear();
  await db.profile.put({ id: "singleton", data: profile });
  useAppStore.setState({
    hydrated: true,
    profile,
    today: "2026-10-05",
    lastBackup: null,
    autoBackup: { status: "on", lastWritten: null },
  });
});

describe("backupToFileNow", () => {
  it("writes the data and records when, so the reminder stays quiet", async () => {
    expect(await backupToFileNow()).toBe("written");
    expect(mocks.write).toHaveBeenCalledTimes(1);
    const json = mocks.write.mock.calls[0]?.[0] ?? "";
    expect(JSON.parse(json)).toBeTruthy();
    expect(useAppStore.getState().lastBackup).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(useAppStore.getState().autoBackup.lastWritten).not.toBeNull();
  });

  it("marks that permission is needed, and leaves the last backup date alone", async () => {
    mocks.write.mockResolvedValueOnce("needs-permission");
    expect(await backupToFileNow()).toBe("needs-permission");
    expect(useAppStore.getState().autoBackup.status).toBe("needs-permission");
    expect(useAppStore.getState().lastBackup).toBeNull();
  });
});

describe("useDataSafety", () => {
  const delay = 60;
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  it("writes the file once after a burst of changes, not after each one", async () => {
    renderHook(() => useDataSafety(delay));
    await waitFor(() => expect(mocks.status).toHaveBeenCalled());
    act(() => {
      useAppStore.setState({ profile: { ...profile, savings: 1 } });
      useAppStore.setState({ profile: { ...profile, savings: 2 } });
      useAppStore.setState({ profile: { ...profile, savings: 3 } });
    });
    await act(() => wait(delay / 3));
    expect(mocks.write).not.toHaveBeenCalled();
    await waitFor(() => expect(mocks.write).toHaveBeenCalledTimes(1));
    await act(() => wait(delay * 2));
    expect(mocks.write).toHaveBeenCalledTimes(1);
  });

  it("does not write when automatic backup is off", async () => {
    useAppStore.setState({ autoBackup: { status: "off", lastWritten: null } });
    mocks.status.mockResolvedValueOnce("off" as never);
    renderHook(() => useDataSafety(delay));
    act(() => useAppStore.setState({ profile: { ...profile, savings: 9 } }));
    await act(() => wait(delay * 3));
    expect(mocks.write).not.toHaveBeenCalled();
  });

  it("does not write for a change that is not the user's data", async () => {
    renderHook(() => useDataSafety(delay));
    await waitFor(() => expect(mocks.status).toHaveBeenCalled());
    act(() => useAppStore.setState({ today: "2026-10-06" }));
    await act(() => wait(delay * 3));
    expect(mocks.write).not.toHaveBeenCalled();
  });

  it("keeps a copy for today inside the browser", async () => {
    renderHook(() => useDataSafety(delay));
    await waitFor(async () => expect(await db.backups.get("2026-10-05")).toBeDefined());
  });
});
