import { SinkingFundSchema, type SinkingFund } from "@stoafi/core";
import type { StoafiDb } from "./db";
import { putListItem } from "./repo";

export async function saveSinkingFund(db: StoafiDb, fund: SinkingFund): Promise<SinkingFund> {
  return putListItem(db, "sinkingFunds", SinkingFundSchema, fund);
}

export async function removeSinkingFund(db: StoafiDb, id: string): Promise<void> {
  await db.sinkingFunds.delete(id);
}
