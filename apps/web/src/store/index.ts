import { useMemo } from "react";
import { create } from "zustand";
import {
  installmentCommitments,
  projectSeries,
  type Commitment,
  type Card,
  type Decision,
  type GuardThresholds,
  type Holding,
  type Snapshot,
  type Minor,
  type Month,
  type PlanStateInput,
  type Profile,
  type QueueItem,
  type SinkingFund,
  type ThemePreference,
} from "@stoafi/core";
import type { Locale } from "@/i18n/messages";
import { monthOf } from "@/lib/clock";
import type { LoadedState } from "@/storage/bootstrap";
import type { PinLock } from "@/lib/pin";
import { buildLedger } from "./ledger";

/** Something the command palette asked the page it opens to start doing. */
export type QuickAction = "addQueueItem" | "addCard" | "addPot" | "addInvestment" | null;

export interface AppState {
  profile: Profile | null;
  planState: PlanStateInput | null;
  queueItems: QueueItem[];
  sinkingFunds: SinkingFund[];
  cards: Card[];
  decisions: Decision[];
  holdings: Holding[];
  snapshots: Snapshot[];
  locale: Locale;
  currency: string;
  theme: ThemePreference;
  /** Lesson cards marked as read. */
  readLessons: string[];
  /** True while sample data from the demo is loaded. */
  demo: boolean;
  quickAction: QuickAction;
  hideAmounts: boolean;
  /** YYYY-MM-DD of the last downloaded backup, if any. */
  lastBackup: string | null;
  /** The PIN lock, when one is set. */
  lock: PinLock | null;
  /** True while the lock screen covers the app. */
  locked: boolean;
  guardThresholds: GuardThresholds;
  /** Local date (YYYY-MM-DD) set at the app boundary; core never reads the clock. */
  today: string;
  /** False until the first load from Dexie has finished. */
  hydrated: boolean;

  hydrate: (loaded: LoadedState, today: string) => void;
  setProfile: (profile: Profile) => void;
  setPlanState: (planState: PlanStateInput) => void;
  setQueueItems: (items: QueueItem[]) => void;
  setSinkingFunds: (funds: SinkingFund[]) => void;
  setCards: (cards: Card[]) => void;
  setDecisions: (decisions: Decision[]) => void;
  setHoldings: (holdings: Holding[]) => void;
  setSnapshots: (snapshots: Snapshot[]) => void;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: string) => void;
  setTheme: (theme: ThemePreference) => void;
  toggleLessonRead: (id: string) => void;
  setDemo: (demo: boolean) => void;
  setQuickAction: (action: QuickAction) => void;
  setHideAmounts: (hide: boolean) => void;
  setLastBackup: (date: string) => void;
  setLock: (lock: PinLock | null) => void;
  setLocked: (locked: boolean) => void;
  setGuardThresholds: (thresholds: GuardThresholds) => void;
  setToday: (today: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  planState: null,
  queueItems: [],
  sinkingFunds: [],
  cards: [],
  decisions: [],
  holdings: [],
  snapshots: [],
  locale: "en",
  currency: "TRY",
  theme: "system",
  readLessons: [],
  demo: false,
  quickAction: null,
  hideAmounts: false,
  lastBackup: null,
  lock: null,
  locked: false,
  guardThresholds: { installmentCapPct: 0.2 },
  today: "1970-01-01",
  hydrated: false,

  hydrate: (loaded, today) =>
    set({
      profile: loaded.profile,
      planState: loaded.planState,
      queueItems: loaded.queueItems,
      sinkingFunds: loaded.sinkingFunds,
      cards: loaded.cards,
      decisions: loaded.decisions,
      holdings: loaded.holdings,
      snapshots: loaded.snapshots,
      locale: loaded.settings.locale,
      currency: loaded.settings.currency,
      theme: loaded.settings.theme ?? "system",
      readLessons: loaded.settings.readLessons ?? [],
      demo: loaded.settings.demo ?? false,
      hideAmounts: loaded.settings.hideAmounts ?? false,
      lastBackup: loaded.settings.lastBackup ?? null,
      lock: loaded.settings.lock ?? null,
      // A saved PIN covers the app from the first moment.
      locked: loaded.settings.lock !== undefined,
      guardThresholds: loaded.guardThresholds,
      today,
      hydrated: true,
    }),
  setProfile: (profile) => set({ profile }),
  setPlanState: (planState) => set({ planState }),
  setQueueItems: (queueItems) => set({ queueItems }),
  setSinkingFunds: (sinkingFunds) => set({ sinkingFunds }),
  setCards: (cards) => set({ cards }),
  setDecisions: (decisions) => set({ decisions }),
  setHoldings: (holdings) => set({ holdings }),
  setSnapshots: (snapshots) => set({ snapshots }),
  setLocale: (locale) => set({ locale }),
  setCurrency: (currency) => set({ currency }),
  setTheme: (theme) => set({ theme }),
  setDemo: (demo) => set({ demo }),
  setQuickAction: (quickAction) => set({ quickAction }),
  setHideAmounts: (hideAmounts) => set({ hideAmounts }),
  setLastBackup: (lastBackup) => set({ lastBackup }),
  setLock: (lock) => set({ lock }),
  setLocked: (locked) => set({ locked }),
  toggleLessonRead: (id) =>
    set((state) => ({
      readLessons: state.readLessons.includes(id)
        ? state.readLessons.filter((x) => x !== id)
        : [...state.readLessons, id],
    })),
  setGuardThresholds: (guardThresholds) => set({ guardThresholds }),
  setToday: (today) => set((state) => (state.today === today ? state : { today })),
}));

/**
 * Derives a projection series from the store's current state — never
 * stored, always recomputed (SPEC: "the monthly projection is derived,
 * never persisted").
 */
export function deriveProjection(
  state: AppState,
  income: Minor,
  months: Month[],
  bucketLimits?: Parameters<typeof projectSeries>[3],
) {
  return projectSeries({ income }, installmentCommitments(state.queueItems), months, bucketLimits);
}

/**
 * Active installment commitments, derived from queue items bought in
 * installments. Cash purchases are decisions only and never become commitments.
 */
export function useInstallmentCommitments(): Commitment[] {
  const queueItems = useAppStore((s) => s.queueItems);
  return useMemo(() => installmentCommitments(queueItems), [queueItems]);
}

/** The full ledger (recurring costs + installments) for the current month on. */
export function useLedger(): Commitment[] {
  const profile = useAppStore((s) => s.profile);
  const queueItems = useAppStore((s) => s.queueItems);
  const sinkingFunds = useAppStore((s) => s.sinkingFunds);
  const today = useAppStore((s) => s.today);
  return useMemo(
    () => buildLedger(profile, queueItems, monthOf(today), sinkingFunds),
    [profile, queueItems, sinkingFunds, today],
  );
}
