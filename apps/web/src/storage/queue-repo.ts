import { QueueItemSchema, type QueueItem } from "@stoafi/core";
import type { StoafiDb } from "./db";
import { putListItem } from "./repo";

export async function saveQueueItem(db: StoafiDb, item: QueueItem): Promise<QueueItem> {
  return putListItem(db, "queue", QueueItemSchema, item);
}

export async function removeQueueItem(db: StoafiDb, id: string): Promise<void> {
  await db.queue.delete(id);
}

/** Writes every item (already renumbered by the caller) in one transaction, or none if any is invalid. */
export async function saveQueueOrder(db: StoafiDb, items: QueueItem[]): Promise<void> {
  const parsed = items.map((item) => QueueItemSchema.parse(item));
  await db.transaction("rw", db.queue, async () => {
    await db.queue.bulkPut(parsed);
  });
}
