import type { Commitment } from "../../kernel/commitment";
import type { Month } from "../../kernel/month";
import type { QueueItem } from "./schema";

/** A queue item, priced for cash, as a draft one-off commitment in `month`. */
export function toDraftCommitment(item: QueueItem, month: Month): Commitment {
  return {
    id: item.id,
    source: { module: "queue", refId: item.id },
    bucket: item.isNeed ? "needs" : "wants",
    payments: [{ month, amount: item.discountedCashPrice ?? item.price }],
    status: "draft",
  };
}
