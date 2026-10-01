import type { BasketEntry } from "../../kernel/basket";
import type { Minor } from "../../kernel/money";
import type { Holding } from "./schema";
import { marketValue } from "./selectors";

export interface BasketValues {
  /** Current market value held in each basket slice, by entry id. */
  values: Record<string, Minor>;
  /** Holdings that do not belong to any slice yet. */
  unassigned: Holding[];
}

/**
 * Which slice each holding counts toward: the one the user picked, otherwise the only slice of the same
 * kind. Anything still ambiguous (two slices of one kind, or none) is left unassigned for the user to place.
 */
export function basketValues(holdings: Holding[], entries: BasketEntry[]): BasketValues {
  const values: Record<string, Minor> = Object.fromEntries(entries.map((e) => [e.id, 0]));
  const unassigned: Holding[] = [];
  for (const holding of holdings) {
    const picked = entries.find((e) => e.id === holding.basketId);
    const sameKind = entries.filter((e) => e.typeId !== undefined && e.typeId === holding.typeId);
    const target = picked ?? (sameKind.length === 1 ? sameKind[0] : undefined);
    if (target) values[target.id] = (values[target.id] ?? 0) + marketValue(holding).value;
    else unassigned.push(holding);
  }
  return { values, unassigned };
}
