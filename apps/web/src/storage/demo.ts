import {
  CardSchema,
  DecisionSchema,
  HoldingSchema,
  PlanStateSchema,
  ProfileSchema,
  QueueItemSchema,
  SinkingFundSchema,
} from "@stoafi/core";
import type { DemoData } from "@/lib/demo-data";
import type { StoafiDb } from "./db";
import { putListItem, putSingleton } from "./repo";

/** Empties every table that holds the user's data. Settings (language, theme) are kept. */
export async function clearUserData(db: StoafiDb): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.profile,
      db.plan,
      db.guards,
      db.queue,
      db.sinkingFunds,
      db.cards,
      db.decisions,
      db.holdings,
      db.snapshots,
    ],
    async () => {
      await Promise.all([
        db.profile.clear(),
        db.plan.clear(),
        db.guards.clear(),
        db.queue.clear(),
        db.sinkingFunds.clear(),
        db.cards.clear(),
        db.decisions.clear(),
        db.holdings.clear(),
        db.snapshots.clear(),
      ]);
    },
  );
}

/** Replaces whatever is stored with the sample data. Every record is validated like a real save. */
export async function writeDemoData(db: StoafiDb, data: DemoData): Promise<void> {
  await clearUserData(db);
  await putSingleton(db, "profile", ProfileSchema, data.profile);
  await putSingleton(db, "plan", PlanStateSchema, data.planState);
  for (const item of data.queueItems) await putListItem(db, "queue", QueueItemSchema, item);
  for (const fund of data.sinkingFunds)
    await putListItem(db, "sinkingFunds", SinkingFundSchema, fund);
  for (const card of data.cards) await putListItem(db, "cards", CardSchema, card);
  for (const d of data.decisions) await putListItem(db, "decisions", DecisionSchema, d);
  for (const h of data.holdings) await putListItem(db, "holdings", HoldingSchema, h);
}
