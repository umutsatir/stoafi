import { useMemo } from "react";
import { create } from "zustand";
import {
  installmentCommitments,
  projectSeries,
  type Commitment,
  type Card,
  type Decision,
  type GuardThresholds,
  type Minor,
  type Month,
  type PlanStateInput,
  type Profile,
  type QueueItem,
  type SinkingFund,
} from "@stoafi/core";
import type { Locale } from "@/i18n/messages";
import { monthOf } from "@/lib/clock";
import type { LoadedState } from "@/storage/bootstrap";
import { buildLedger } from "./ledger";

export interface AppState {
  profile: Profile | null;
  planState: PlanStateInput | null;
  queueItems: QueueItem[];
  sinkingFunds: SinkingFund[];
  cards: Card[];
  decisions: Decision[];
  locale: Locale;
  currency: string;
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
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: string) => void;
  setGuardThresholds: (thresholds: GuardThresholds) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  planState: null,
  queueItems: [],
  sinkingFunds: [],
  cards: [],
  decisions: [],
  locale: "en",
  currency: "TRY",
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
      locale: loaded.settings.locale,
      currency: loaded.settings.currency,
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
  setLocale: (locale) => set({ locale }),
  setCurrency: (currency) => set({ currency }),
  setGuardThresholds: (guardThresholds) => set({ guardThresholds }),
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
