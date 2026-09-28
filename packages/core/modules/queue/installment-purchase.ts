import type { Commitment, CommitmentStatus } from "../../kernel/commitment";
import { addMonths, type Month } from "../../kernel/month";
import type { InstallmentOfferInput } from "../installments/schema";
import type { QueueItem } from "./schema";

/**
 * A queue item paid in installments as a commitment: one payment per offer
 * payment, from `firstMonth` on. Sourced from `installments` (SPEC: projections
 * derive installment load from that source), even though the queue owns the
 * item; the queue module only builds it, it never imports installments logic.
 */
export function toInstallmentCommitment(
  item: QueueItem,
  offer: InstallmentOfferInput,
  firstMonth: Month,
  status: CommitmentStatus,
): Commitment {
  return {
    id: `installment-${item.id}`,
    source: { module: "installments", refId: item.id },
    bucket: item.isNeed ? "needs" : "wants",
    payments: offer.payments.map((amount, index) => ({
      month: addMonths(firstMonth, index),
      amount,
    })),
    status,
  };
}

/**
 * The ledger's installment side, derived from the queue items already bought
 * in installments. Derived on every read, never stored a second time.
 */
export function installmentCommitments(items: QueueItem[]): Commitment[] {
  return items.flatMap((item) =>
    item.installmentPurchase
      ? [
          toInstallmentCommitment(
            item,
            item.installmentPurchase.offer,
            item.installmentPurchase.firstMonth,
            "active",
          ),
        ]
      : [],
  );
}

/** Items still waiting to be bought (bought-in-installments items live in expenses, not the queue). */
export function activeQueueItems(items: QueueItem[]): QueueItem[] {
  return items.filter((item) => !item.installmentPurchase);
}
