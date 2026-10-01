import { addMonths, type Month } from "./month";

export type CalendarKind = "income" | "expense" | "card";

/** Something that happens on the same day every month: a pay day, a bill, a card's due date. */
export interface DayRule {
  id: string;
  label: string;
  kind: CalendarKind;
  /** 1-31; a month without that day uses its last day. */
  day: number;
  amount?: number;
  /** Last month the rule applies in. */
  endMonth?: Month;
}

export interface CalendarEvent {
  id: string;
  label: string;
  kind: CalendarKind;
  /** YYYY-MM-DD */
  date: string;
  amount?: number;
  daysAway: number;
}

function daysInMonth(month: Month): number {
  const [year, m] = month.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

/** The date of `day` in `month`, clamped to the month's last day. */
export function dueDateInMonth(month: Month, day: number): string {
  const clamped = Math.min(day, daysInMonth(month));
  return `${month}-${String(clamped).padStart(2, "0")}`;
}

const dayNumber = (date: string): number =>
  Math.round(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) / 86_400_000);

/**
 * Events from `today` through `days` days later (both ends included), soonest first.
 * `today` is passed in, never read from the clock.
 */
export function upcomingEvents(rules: DayRule[], today: string, days: number): CalendarEvent[] {
  if (days <= 0) return [];
  const start = dayNumber(today);
  const first = today.slice(0, 7) as Month;
  const months = [first, addMonths(first, 1), addMonths(first, 2)];
  const events: CalendarEvent[] = [];
  for (const rule of rules) {
    for (const month of months) {
      if (rule.endMonth && month > rule.endMonth) continue;
      const date = dueDateInMonth(month, rule.day);
      const daysAway = dayNumber(date) - start;
      if (daysAway < 0 || daysAway > days) continue;
      events.push({
        id: rule.id,
        label: rule.label,
        kind: rule.kind,
        date,
        ...(rule.amount !== undefined ? { amount: rule.amount } : {}),
        daysAway,
      });
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label));
}

/** Every event in one month, soonest first. `daysAway` is 0 here: it only has meaning from a given day. */
export function eventsInMonth(rules: DayRule[], month: Month): CalendarEvent[] {
  return rules
    .filter((rule) => !rule.endMonth || month <= rule.endMonth)
    .map((rule): CalendarEvent => ({
      id: rule.id,
      label: rule.label,
      kind: rule.kind,
      date: dueDateInMonth(month, rule.day),
      ...(rule.amount !== undefined ? { amount: rule.amount } : {}),
      daysAway: 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label));
}
