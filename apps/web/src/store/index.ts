import { create } from "zustand";
import {
  projectSeries,
  type Card,
  type Commitment,
  type Decision,
  type Minor,
  type Month,
  type PlanStateInput,
  type Profile,
  type QueueItem,
  type SinkingFund,
} from "@stoafi/core";
import type { Locale } from "@/i18n/messages";

export interface AppState {
  profile: Profile | null;
  planState: PlanStateInput | null;
  queueItems: QueueItem[];
  sinkingFunds: SinkingFund[];
  cards: Card[];
  decisions: Decision[];
  commitments: Commitment[];
  locale: Locale;
  currency: string;

  setProfile: (profile: Profile) => void;
  setPlanState: (planState: PlanStateInput) => void;
  setQueueItems: (items: QueueItem[]) => void;
  setSinkingFunds: (funds: SinkingFund[]) => void;
  setCards: (cards: Card[]) => void;
  setDecisions: (decisions: Decision[]) => void;
  setCommitments: (commitments: Commitment[]) => void;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  planState: null,
  queueItems: [],
  sinkingFunds: [],
  cards: [],
  decisions: [],
  commitments: [],
  locale: "en",
  currency: "TRY",

  setProfile: (profile) => set({ profile }),
  setPlanState: (planState) => set({ planState }),
  setQueueItems: (queueItems) => set({ queueItems }),
  setSinkingFunds: (sinkingFunds) => set({ sinkingFunds }),
  setCards: (cards) => set({ cards }),
  setDecisions: (decisions) => set({ decisions }),
  setCommitments: (commitments) => set({ commitments }),
  setLocale: (locale) => set({ locale }),
  setCurrency: (currency) => set({ currency }),
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
  return projectSeries({ income }, state.commitments, months, bucketLimits);
}
