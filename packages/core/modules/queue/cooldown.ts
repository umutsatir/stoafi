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
