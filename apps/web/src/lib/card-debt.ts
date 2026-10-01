import {
  installmentDebtByCard,
  remainingInstallmentsByCard,
  type Month,
  type Profile,
  type QueueItem,
} from "@stoafi/core";

/**
 * What installments still owe on each card: purchases made through the queue plus installment lines the
 * user entered as expenses. Both count against the card's limit.
 */
export function remainingByCard(
  queueItems: QueueItem[],
  profile: Profile | null,
  month: Month,
): Record<string, number> {
  const total: Record<string, number> = { ...remainingInstallmentsByCard(queueItems, month) };
  if (profile) {
    for (const [cardId, amount] of Object.entries(installmentDebtByCard(profile, month))) {
      total[cardId] = (total[cardId] ?? 0) + amount;
    }
  }
  return total;
}
