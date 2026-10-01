import { SnapshotSchema, type Snapshot } from "@stoafi/core";
import type { StoafiDb } from "./db";
import { putListItem } from "./repo";

export async function saveSnapshot(db: StoafiDb, snapshot: Snapshot): Promise<Snapshot> {
  return putListItem(db, "snapshots", SnapshotSchema, snapshot);
}
