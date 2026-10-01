import type { Card } from "./schema";

const isSupplementary = (card: Card): boolean => card.kind === "supplementary";

/** Cards that carry their own limit: everything that is not supplementary. */
export function mainCards(cards: Card[]): Card[] {
  return cards.filter((card) => !isSupplementary(card));
}

export function supplementariesOf(cards: Card[], mainId: string): Card[] {
  return cards.filter((card) => isSupplementary(card) && card.parentId === mainId);
}

export interface CardSetProblem {
  cardId: string;
  problem: "duplicate-id" | "missing-parent" | "nested-supplementary";
}

/** Cross-card checks a single card's schema cannot make. Empty means the set is consistent. */
export function validateCardSet(cards: Card[]): CardSetProblem[] {
  const problems: CardSetProblem[] = [];
  const seen = new Set<string>();
  for (const card of cards) {
    if (seen.has(card.id)) problems.push({ cardId: card.id, problem: "duplicate-id" });
    seen.add(card.id);
  }
  for (const card of cards) {
    if (!isSupplementary(card)) continue;
    const parent = cards.find((c) => c.id === card.parentId);
    if (!parent) problems.push({ cardId: card.id, problem: "missing-parent" });
    else if (isSupplementary(parent)) {
      problems.push({ cardId: card.id, problem: "nested-supplementary" });
    }
  }
  return problems;
}

export interface LimitUsage {
  limit: number;
  /** Debt on the main card and all its supplementary cards, plus their remaining installments. */
  used: number;
  available: number;
  overLimit: boolean;
  /** What each card in the group owes: its own debt plus its remaining installments. */
  byCard: Record<string, number>;
}

/**
 * One shared limit for a main card and its supplementary cards. `remainingInstallments`
 * is what is still to be paid on installment purchases, per card id; the caller works it out
 * from the queue, so this module never has to know about purchases.
 * Null when the id is not a main card or the limit was never entered (unknown is not zero).
 */
export function limitUsage(
  cards: Card[],
  mainId: string,
  remainingInstallments: Record<string, number>,
): LimitUsage | null {
  const main = cards.find((card) => card.id === mainId);
  if (!main || isSupplementary(main) || main.limit === undefined) return null;

  const byCard: Record<string, number> = {};
  for (const card of [main, ...supplementariesOf(cards, mainId)]) {
    byCard[card.id] = (card.currentDebt ?? 0) + (remainingInstallments[card.id] ?? 0);
  }
  const used = Object.values(byCard).reduce((sum, amount) => sum + amount, 0);
  return {
    limit: main.limit,
    used,
    available: Math.max(0, main.limit - used),
    overLimit: used > main.limit,
    byCard,
  };
}

export type SupplementaryChoice =
  | { supplementary: "delete" }
  /** Keep the supplementary cards as main cards, each with a limit of its own. */
  | { supplementary: "detach"; limits: Record<string, number> };

export type RemoveResult =
  { ok: true; cards: Card[]; removedIds: string[] } | { ok: false; missingLimitFor: string[] };

/** Removes a card, deciding what happens to the supplementary cards of a main card. */
export function removeCardFromSet(
  cards: Card[],
  id: string,
  choice: SupplementaryChoice,
): RemoveResult {
  const target = cards.find((card) => card.id === id);
  if (!target) return { ok: true, cards, removedIds: [] };

  const children = isSupplementary(target) ? [] : supplementariesOf(cards, id);
  if (children.length === 0) {
    return { ok: true, cards: cards.filter((c) => c.id !== id), removedIds: [id] };
  }

  if (choice.supplementary === "delete") {
    const removed = new Set([id, ...children.map((c) => c.id)]);
    return {
      ok: true,
      cards: cards.filter((c) => !removed.has(c.id)),
      removedIds: [id, ...children.map((c) => c.id)],
    };
  }

  const missing = children.filter((c) => choice.limits[c.id] === undefined).map((c) => c.id);
  if (missing.length > 0) return { ok: false, missingLimitFor: missing };
  return {
    ok: true,
    removedIds: [id],
    cards: cards
      .filter((c) => c.id !== id)
      .map((c) => {
        const limit = choice.limits[c.id];
        if (!children.some((child) => child.id === c.id) || limit === undefined) return c;
        const detached: Card = { ...c, kind: "main", limit };
        delete detached.parentId;
        return detached;
      }),
  };
}
