"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { SettingsSchema } from "@stoafi/core";
import { localIsoDate } from "@/lib/clock";
import { loadAppState } from "@/storage/bootstrap";
import { db } from "@/storage/instance";
import { putSingleton } from "@/storage/repo";
import { DataLost } from "@/components/data-lost";
import { LockGate } from "@/components/lock-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { clearHadData, hadData, markHadData } from "@/lib/had-data";
import { applyTheme } from "@/lib/theme";
import { importFromJson } from "@/storage/backup";
import { useSnapshotRecorder } from "@/lib/use-snapshot-recorder";
import { useAppStore } from "@/store";

/** Loads saved data into the store once, keeps language and currency saved, then renders the app. */
export function AppBootstrap({ children }: { children: ReactNode }) {
  const t = useTranslations("app");
  useSnapshotRecorder();
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const profile = useAppStore((s) => s.profile);
  const [lost, setLost] = useState(false);
  const setToday = useAppStore((s) => s.setToday);
  const locale = useAppStore((s) => s.locale);
  const currency = useAppStore((s) => s.currency);
  const theme = useAppStore((s) => s.theme);
  const readLessons = useAppStore((s) => s.readLessons);
  const demo = useAppStore((s) => s.demo);
  const hideAmounts = useAppStore((s) => s.hideAmounts);
  const lock = useAppStore((s) => s.lock);
  const lastBackup = useAppStore((s) => s.lastBackup);
  const basket = useAppStore((s) => s.basket);
  const basketLog = useAppStore((s) => s.basketLog);
  const basketMonthly = useAppStore((s) => s.basketMonthly);

  useEffect(() => {
    let cancelled = false;
    void loadAppState(db, navigator.language).then((loaded) => {
      if (!cancelled) hydrate(loaded, localIsoDate(new Date()));
    });
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  // Remember that this browser held real data, so an empty database later is noticed instead of ignored.
  useEffect(() => {
    if (!hydrated) return;
    if (profile && !demo) markHadData();
    else if (!profile && !demo && hadData()) setLost(true);
  }, [hydrated, profile, demo]);

  // Whatever the screens change, the saved preferences and the page language follow.
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = locale;
    void putSingleton(db, "settings", SettingsSchema, {
      locale,
      currency,
      theme,
      readLessons,
      ...(demo ? { demo } : {}),
      ...(hideAmounts ? { hideAmounts } : {}),
      ...(lock ? { lock } : {}),
      ...(lastBackup ? { lastBackup } : {}),
      ...(basket.length > 0 ? { basket } : {}),
      ...(basketLog.length > 0 ? { basketLog } : {}),
      ...(basketMonthly !== null ? { basketMonthly } : {}),
    }).catch((error) => console.error("Could not save settings", error));
  }, [
    hydrated,
    locale,
    currency,
    theme,
    readLessons,
    demo,
    hideAmounts,
    lock,
    lastBackup,
    basket,
    basketLog,
    basketMonthly,
  ]);

  // Follow the saved theme, and the system's while the user has not picked one.
  useEffect(() => {
    if (!hydrated) return;
    applyTheme(theme);
    if (theme !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const follow = () => applyTheme("system");
    query.addEventListener("change", follow);
    return () => query.removeEventListener("change", follow);
  }, [hydrated, theme]);

  // An installed app can stay open for days; when it comes back to the front, move to the new day.
  useEffect(() => {
    if (!hydrated) return;
    const refresh = () => setToday(localIsoDate(new Date()));
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [hydrated, setToday]);

  if (hydrated && lost) {
    return (
      <DataLost
        onStartFresh={() => {
          clearHadData();
          setLost(false);
        }}
        onRestore={async (json) => {
          try {
            const result = await importFromJson(db, json);
            if ("errors" in result) return result.errors.map((e) => String(e));
            hydrate(await loadAppState(db, navigator.language), localIsoDate(new Date()));
            setLost(false);
            return null;
          } catch {
            return [t("restoreFailed")];
          }
        }}
      />
    );
  }
  if (hydrated) return <LockGate>{children}</LockGate>;
  return (
    <div role="status" aria-label={t("loading")} className="flex flex-col gap-4">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
