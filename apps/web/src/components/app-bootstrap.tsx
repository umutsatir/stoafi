"use client";

import { useEffect, type ReactNode } from "react";
import { SettingsSchema } from "@stoafi/core";
import { localIsoDate } from "@/lib/clock";
import { loadAppState } from "@/storage/bootstrap";
import { db } from "@/storage/instance";
import { putSingleton } from "@/storage/repo";
import { applyTheme } from "@/lib/theme";
import { useAppStore } from "@/store";

/** Loads saved data into the store once, keeps language and currency saved, then renders the app. */
export function AppBootstrap({ children }: { children: ReactNode }) {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const setToday = useAppStore((s) => s.setToday);
  const locale = useAppStore((s) => s.locale);
  const currency = useAppStore((s) => s.currency);
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    let cancelled = false;
    void loadAppState(db, navigator.language).then((loaded) => {
      if (!cancelled) hydrate(loaded, localIsoDate(new Date()));
    });
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  // Whatever the screens change, the saved preferences and the page language follow.
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = locale;
    void putSingleton(db, "settings", SettingsSchema, { locale, currency, theme }).catch((error) =>
      console.error("Could not save settings", error),
    );
  }, [hydrated, locale, currency, theme]);

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

  return hydrated ? <>{children}</> : null;
}
