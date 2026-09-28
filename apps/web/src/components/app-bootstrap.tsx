"use client";

import { useEffect, type ReactNode } from "react";
import { localIsoDate } from "@/lib/clock";
import { loadAppState } from "@/storage/bootstrap";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";

/** Loads saved data into the store once, then renders the app. */
export function AppBootstrap({ children }: { children: ReactNode }) {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);

  useEffect(() => {
    let cancelled = false;
    void loadAppState(db).then((loaded) => {
      if (!cancelled) hydrate(loaded, localIsoDate(new Date()));
    });
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  return hydrated ? <>{children}</> : null;
}
