import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Profile } from "@stoafi/core";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";
import { useSnapshotRecorder } from "./use-snapshot-recorder";

const profile: Profile = {
  incomes: [{ label: "Job", monthly: 6_000_000 }],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 1_000_000,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

beforeEach(async () => {
  await db.snapshots.clear();
  useAppStore.setState({
    hydrated: true,
    profile,
    planState: { strategyId: "fifty-thirty-twenty", params: {} },
    queueItems: [],
    sinkingFunds: [],
    holdings: [],
    snapshots: [],
    today: "2026-10-15",
  });
});

describe("useSnapshotRecorder", () => {
  it("records this month once the data is loaded, in the store and the database", async () => {
    renderHook(() => useSnapshotRecorder());
    await waitFor(() => expect(useAppStore.getState().snapshots).toHaveLength(1));
    expect(useAppStore.getState().snapshots[0]?.month).toBe("2026-10");
    await waitFor(async () => expect(await db.snapshots.count()).toBe(1));
  });

  it("updates the same month when the numbers change instead of adding another", async () => {
    renderHook(() => useSnapshotRecorder());
    await waitFor(() => expect(useAppStore.getState().snapshots).toHaveLength(1));
    useAppStore.setState({ profile: { ...profile, savings: 2_000_000 } });
    await waitFor(() => expect(useAppStore.getState().snapshots[0]?.wealth).toBe(2_000_000));
    expect(useAppStore.getState().snapshots).toHaveLength(1);
  });

  it("starts a new snapshot in a new month and keeps the old one", async () => {
    renderHook(() => useSnapshotRecorder());
    await waitFor(() => expect(useAppStore.getState().snapshots).toHaveLength(1));
    useAppStore.setState({ today: "2026-11-02" });
    await waitFor(() => expect(useAppStore.getState().snapshots).toHaveLength(2));
    expect(useAppStore.getState().snapshots.map((s) => s.month)).toEqual(["2026-10", "2026-11"]);
  });

  it("records nothing before there is a profile or before the data has loaded", async () => {
    useAppStore.setState({ profile: null });
    renderHook(() => useSnapshotRecorder());
    await new Promise((r) => setTimeout(r, 30));
    expect(useAppStore.getState().snapshots).toEqual([]);
    useAppStore.setState({ profile, hydrated: false });
    await new Promise((r) => setTimeout(r, 30));
    expect(useAppStore.getState().snapshots).toEqual([]);
  });
});
