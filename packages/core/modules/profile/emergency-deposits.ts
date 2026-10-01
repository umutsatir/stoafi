import { addDeposit, editDeposit, removeDeposit, type Deposit } from "../../kernel/deposit";
import { roundHalfToEven, type Minor } from "../../kernel/money";
import type { Profile } from "./schema";

export type ProfileDepositResult =
  | { ok: true; profile: Profile }
  | { ok: false; reason: "invalid" | "insufficient-balance" | "not-found" };

function apply(profile: Profile, result: ReturnType<typeof addDeposit>): ProfileDepositResult {
  if (!result.ok) return result;
  return { ok: true, profile: { ...profile, savings: result.balance, deposits: result.deposits } };
}

/** Money into (or out of) the emergency fund; `Profile.savings` and the log always move together. */
export function addEmergencyDeposit(profile: Profile, deposit: Deposit): ProfileDepositResult {
  return apply(
    profile,
    addDeposit({ balance: profile.savings, deposits: profile.deposits }, deposit),
  );
}

export function editEmergencyDeposit(profile: Profile, deposit: Deposit): ProfileDepositResult {
  return apply(
    profile,
    editDeposit({ balance: profile.savings, deposits: profile.deposits }, deposit),
  );
}

export function removeEmergencyDeposit(profile: Profile, id: string): ProfileDepositResult {
  return apply(
    profile,
    removeDeposit({ balance: profile.savings, deposits: profile.deposits }, id),
  );
}

/** How far the savings are below the emergency-fund target (needs times target months). */
export function emergencyGap(savings: Minor, monthlyNeeds: Minor, targetMonths: number): Minor {
  const target = roundHalfToEven(monthlyNeeds * targetMonths);
  return Math.max(0, target - savings);
}
