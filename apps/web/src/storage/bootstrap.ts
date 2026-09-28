import {
  CardSchema,
  DecisionSchema,
  PlanStateSchema,
  ProfileSchema,
  QueueItemSchema,
  SinkingFundSchema,
  defaultPlanState,
  type Card,
  type Decision,
  type PlanStateInput,
  type Profile,
  type QueueItem,
  type SinkingFund,
} from "@stoafi/core";
import type { StoafiDb } from "./db";
import { getSingleton, listItems } from "./repo";

export interface LoadedState {
  profile: Profile | null;
  planState: PlanStateInput;
  queueItems: QueueItem[];
  sinkingFunds: SinkingFund[];
  cards: Card[];
  decisions: Decision[];
}

/** Runs one loader; a row that no longer validates is reported and skipped, not fatal. */
async function safely<T>(what: string, load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch (error) {
    console.error(`Could not load ${what} from local storage`, error);
    return fallback;
  }
}

/** Reads everything the app needs from Dexie. A fresh database yields an empty state and the default plan. */
export async function loadAppState(db: StoafiDb): Promise<LoadedState> {
  const [profile, planState, queueItems, sinkingFunds, cards, decisions] = await Promise.all([
    safely("profile", () => getSingleton(db, "profile", ProfileSchema), undefined),
    safely("plan", () => getSingleton(db, "plan", PlanStateSchema), undefined),
    safely("queue", () => listItems(db, "queue", QueueItemSchema), []),
    safely("sinking funds", () => listItems(db, "sinkingFunds", SinkingFundSchema), []),
    safely("cards", () => listItems(db, "cards", CardSchema), []),
    safely("decisions", () => listItems(db, "decisions", DecisionSchema), []),
  ]);

  return {
    profile: profile ?? null,
    planState: planState ?? defaultPlanState(),
    queueItems: [...queueItems].sort((a, b) => a.order - b.order),
    sinkingFunds,
    cards,
    decisions,
  };
}
