import { CardSchema, type Card } from "@stoafi/core";
import type { StoafiDb } from "./db";
import { putListItem } from "./repo";

export async function saveCard(db: StoafiDb, card: Card): Promise<Card> {
  return putListItem(db, "cards", CardSchema, card);
}

export async function removeCard(db: StoafiDb, id: string): Promise<void> {
  await db.cards.delete(id);
}
