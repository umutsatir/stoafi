"use client";

import { useEffect } from "react";
import { useAppStore, type QuickAction } from "@/store";

/** Runs `handler` once when the command palette asked for this action, then clears the request. */
export function useQuickAction(action: QuickAction, handler: () => void): void {
  const requested = useAppStore((s) => s.quickAction);
  const clear = useAppStore((s) => s.setQuickAction);
  useEffect(() => {
    if (requested !== action) return;
    handler();
    clear(null);
    // The handler only opens a panel; running it again for a new handler identity would reopen it.
  }, [requested, action, clear]);
}
