import { z } from "zod";
import type { Minor } from "./money";
import type { Month } from "./month";

/** Money put into (positive) or taken out of (negative) a pot, on a day. */
export const DepositSchema = z.object({
  id: z.string(),
  /** YYYY-MM-DD */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().int(),
  note: z.string().optional(),
});

export type Deposit = z.infer<typeof DepositSchema>;

export interface PotState {
  balance: Minor;
  /** Missing on pots saved before deposits existed. */
  deposits: Deposit[] | undefined;
}

export type PotResult =
  | { ok: true; balance: Minor; deposits: Deposit[] }
  | { ok: false; reason: "invalid" | "insufficient-balance" | "not-found" };

const valid = (deposit: Deposit): boolean =>
  DepositSchema.safeParse(deposit).success && deposit.amount !== 0;

/** Records money going in or out. The balance can never go below zero. */
export function addDeposit(pot: PotState, deposit: Deposit): PotResult {
  if (!valid(deposit)) return { ok: false, reason: "invalid" };
  const balance = pot.balance + deposit.amount;
  if (balance < 0) return { ok: false, reason: "insufficient-balance" };
  return { ok: true, balance, deposits: [...(pot.deposits ?? []), deposit] };
}

/** Undoes a recorded deposit or withdrawal. */
export function removeDeposit(pot: PotState, id: string): PotResult {
  const existing = pot.deposits?.find((d) => d.id === id);
  if (!existing || !pot.deposits) return { ok: false, reason: "not-found" };
  const balance = pot.balance - existing.amount;
  if (balance < 0) return { ok: false, reason: "insufficient-balance" };
  return { ok: true, balance, deposits: pot.deposits.filter((d) => d.id !== id) };
}

/** Replaces a recorded deposit and moves the balance by the difference. */
export function editDeposit(pot: PotState, next: Deposit): PotResult {
  if (!valid(next)) return { ok: false, reason: "invalid" };
  const existing = pot.deposits?.find((d) => d.id === next.id);
  if (!existing || !pot.deposits) return { ok: false, reason: "not-found" };
  const balance = pot.balance - existing.amount + next.amount;
  if (balance < 0) return { ok: false, reason: "insufficient-balance" };
  return { ok: true, balance, deposits: pot.deposits.map((d) => (d.id === next.id ? next : d)) };
}

/** Net money added in `month` (deposits minus withdrawals), by the date of each record. */
export function depositedInMonth(deposits: Deposit[] | undefined, month: Month): Minor {
  return (deposits ?? [])
    .filter((d) => d.date.startsWith(month))
    .reduce((sum, d) => sum + d.amount, 0);
}
