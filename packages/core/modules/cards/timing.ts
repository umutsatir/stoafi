import { addMonths, type Month } from "../../kernel/month";
import type { Card } from "./schema";

export interface TimingTip {
  shifted: true;
  extraFloatDays: number;
  newDueMonth: Month;
}

function dayOf(dateStr: string): number {
  const parts = dateStr.split("-").map(Number);
  return parts[2] ?? 1;
}

function monthOf(dateStr: string): Month {
  return dateStr.slice(0, 7) as Month;
}

function dueDateUtc(month: Month, dueDay: number): Date {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year ?? 0, (m ?? 1) - 1, dueDay));
}

/**
 * If buying on `purchaseDate` falls after the card's statement day, the
 * charge lands on next cycle's statement instead of this one, pushing the
 * due date a full month later than it would otherwise be.
 */
export function timingTip(card: Card, purchaseDate: string): TimingTip | null {
  if (dayOf(purchaseDate) <= card.statementDay) {
    return null;
  }

  const purchaseMonth = monthOf(purchaseDate);
  const baselineDueMonth = addMonths(purchaseMonth, 1);
  const shiftedDueMonth = addMonths(purchaseMonth, 2);

  const baselineDue = dueDateUtc(baselineDueMonth, card.dueDay);
  const shiftedDue = dueDateUtc(shiftedDueMonth, card.dueDay);

  const extraFloatDays = Math.round(
    (shiftedDue.getTime() - baselineDue.getTime()) / (24 * 60 * 60 * 1000),
  );

  return { shifted: true, extraFloatDays, newDueMonth: shiftedDueMonth };
}
