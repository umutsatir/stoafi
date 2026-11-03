function toUtcDate(isoDate: string): Date {
  const parts = isoDate.split("-").map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface CooldownStatus {
  active: boolean;
  endsOn: string;
}

/**
 * 30-day cooldown status for a queue item. `today` is always passed in,
 * never computed internally (kernel/module determinism rule). A need is
 * never subject to cooldown.
 */
export function cooldownStatus(
  item: { isNeed: boolean; addedDate: string },
  today: string,
  cooldownDays = 30,
): CooldownStatus {
  if (item.isNeed) {
    return { active: false, endsOn: item.addedDate };
  }

  const endsOnDate = addDays(toUtcDate(item.addedDate), cooldownDays);
  const active = toUtcDate(today).getTime() < endsOnDate.getTime();

  return { active, endsOn: toIsoDate(endsOnDate) };
}

export type CooldownPhase =
  | { phase: "none" }
  | { phase: "counting"; daysLeft: number }
  | { phase: "ask" }
  | { phase: "confirmed"; on: string };

/**
 * Where a want is in its cooldown: still counting, ready to be asked "still want it?", or already
 * confirmed. A confirmation only counts when it was made after the cooldown ended.
 */
export function cooldownPhase(
  item: {
    isNeed: boolean;
    addedDate: string;
    cooldownConfirmedOn?: string;
    installmentBought?: boolean;
  },
  today: string,
  cooldownDays = 30,
): CooldownPhase {
  if (item.isNeed || item.installmentBought) return { phase: "none" };
  const status = cooldownStatus(item, today, cooldownDays);
  if (status.active) {
    const days = Math.round(
      (toUtcDate(status.endsOn).getTime() - toUtcDate(today).getTime()) / (24 * 60 * 60 * 1000),
    );
    return { phase: "counting", daysLeft: days };
  }
  if (item.cooldownConfirmedOn && item.cooldownConfirmedOn >= status.endsOn) {
    return { phase: "confirmed", on: item.cooldownConfirmedOn };
  }
  return { phase: "ask" };
}
