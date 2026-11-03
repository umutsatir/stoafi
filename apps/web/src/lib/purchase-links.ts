import type { Decision, QueueItem } from "@stoafi/core";

/**
 * A purchase bought in installments lives in two places: the "bought" entry in the decision log (the
 * history) and the queue item flagged as an installment purchase (what makes the monthly payments).
 * `queueItemRef` ties them together. These find the other half, so removing one can remove both.
 */

/** The installment purchase a "bought" decision stands for, if it still exists. */
export function installmentOfDecision(
  decision: Decision,
  queueItems: QueueItem[],
): QueueItem | undefined {
  if (decision.outcome !== "bought") return undefined;
  return queueItems.find((i) => i.id === decision.queueItemRef && i.installmentPurchase);
}

/** The "bought" entries in the log for an installment purchase. */
export function boughtDecisionsOf(item: QueueItem, decisions: Decision[]): Decision[] {
  return decisions.filter((d) => d.outcome === "bought" && d.queueItemRef === item.id);
}
