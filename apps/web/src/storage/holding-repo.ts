import { HoldingSchema, type Holding } from "@stoafi/core";
import type { StoafiDb } from "./db";
import { putListItem } from "./repo";

export async function saveHolding(db: StoafiDb, holding: Holding): Promise<Holding> {
  return putListItem(db, "holdings", HoldingSchema, holding);
}

export async function removeHolding(db: StoafiDb, id: string): Promise<void> {
  await db.holdings.delete(id);
}
