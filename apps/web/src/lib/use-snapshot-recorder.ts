"use client";

import { useEffect } from "react";
import { sameSnapshot, upsertSnapshot } from "@stoafi/core";
import { db } from "@/storage/instance";
import { saveSnapshot } from "@/storage/snapshot-repo";
import { useAppStore } from "@/store";
import { snapshotFromState } from "./snapshot-from-state";

/**
 * Keeps this month's snapshot up to date: written when it is missing or its numbers changed, and left
 * alone otherwise, so opening the app does not write to the database every time.
 */
export function useSnapshotRecorder(): void {
  const hydrated = useAppStore((s) => s.hydrated);
  const profile = useAppStore((s) => s.profile);
  const planState = useAppStore((s) => s.planState);
  const queueItems = useAppStore((s) => s.queueItems);
  const sinkingFunds = useAppStore((s) => s.sinkingFunds);
  const holdings = useAppStore((s) => s.holdings);
  const guardThresholds = useAppStore((s) => s.guardThresholds);
  const today = useAppStore((s) => s.today);

  useEffect(() => {
    if (!hydrated || !profile) return;
    const next = snapshotFromState({
      profile,
      planState,
      queueItems,
      sinkingFunds,
      holdings,
      installmentCapPct: guardThresholds.installmentCapPct,
      today,
    });
    const { snapshots, setSnapshots } = useAppStore.getState();
    if (
      sameSnapshot(
        snapshots.find((s) => s.month === next.month),
        next,
      )
    )
      return;
    setSnapshots(upsertSnapshot(snapshots, next));
    void saveSnapshot(db, next).catch((error: unknown) =>
      console.error("Could not save the monthly snapshot", error),
    );
  }, [hydrated, profile, planState, queueItems, sinkingFunds, holdings, guardThresholds, today]);
}
