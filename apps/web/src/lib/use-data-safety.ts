"use client";

import { useEffect } from "react";
import { localIsoDate } from "@/lib/clock";
import { currentStatus, writeToChosenFile } from "@/lib/auto-backup-run";
import { rememberData } from "@/lib/had-data";
import { requestPersistence } from "@/lib/persist-storage";
import { exportToJson } from "@/storage/backup";
import { db } from "@/storage/instance";
import { saveDailyCopy } from "@/storage/internal-backup";
import { useAppStore, type AppState } from "@/store";

/** Wait this long after the last change before writing the backup file, so a burst of edits is one write. */
export const AUTO_BACKUP_DELAY_MS = 8_000;

/** Everything that is the user's data; a change in any of these means the backup file is out of date. */
const DATA_KEYS: (keyof AppState)[] = [
  "profile",
  "planState",
  "queueItems",
  "sinkingFunds",
  "cards",
  "decisions",
  "holdings",
  "snapshots",
  "guardThresholds",
  "basket",
  "basketLog",
  "basketMonthly",
];

/** Writes the data to the chosen backup file now, and records that a backup was made. */
export async function backupToFileNow(): Promise<
  "written" | "needs-permission" | "failed" | "off"
> {
  const now = new Date();
  const json = await exportToJson(db, now.toISOString());
  const result = await writeToChosenFile(json);
  const { setAutoBackup, setLastBackup } = useAppStore.getState();
  if (result === "written") {
    setLastBackup(localIsoDate(now));
    setAutoBackup({ status: "on", lastWritten: now.toISOString() });
  } else if (result === "needs-permission") {
    setAutoBackup({ status: "needs-permission" });
  }
  return result;
}

/**
 * Keeps the user's data safe without being asked: notes that there is data, asks the browser not to clear
 * it, keeps a copy per day inside the browser, and, if the user chose a backup file, writes it after changes.
 */
export function useDataSafety(delayMs: number = AUTO_BACKUP_DELAY_MS): void {
  const hydrated = useAppStore((s) => s.hydrated);
  const hasProfile = useAppStore((s) => s.profile !== null);
  const today = useAppStore((s) => s.today);

  useEffect(() => {
    if (!hydrated || !hasProfile) return;
    rememberData(today);
    void requestPersistence();
    const now = new Date().toISOString();
    void exportToJson(db, now)
      .then((json) => saveDailyCopy(db, today, json, now))
      .catch((error) => console.error("Could not keep the daily copy", error));
  }, [hydrated, hasProfile, today]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    void currentStatus().then((status) => {
      if (!cancelled) useAppStore.getState().setAutoBackup({ status });
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useAppStore.subscribe((state, previous) => {
      if (state.autoBackup.status !== "on") return;
      if (!DATA_KEYS.some((key) => state[key] !== previous[key])) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        void backupToFileNow().catch((error) => console.error("Could not write the backup", error));
      }, delayMs);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [hydrated, delayMs]);
}
