import { addMonths, type Month } from "../../kernel/month";
import type { Commitment } from "../../kernel/commitment";
import { project } from "../../kernel/project";
import { currentAllocation, type PlanState } from "../plan/selectors";
import type { Profile } from "../profile/schema";
import { netMonthlyIncome } from "../profile/selectors";
import { cooldownStatus } from "./cooldown";
import { toDraftCommitment } from "./to-commitment";
import type { QueueItem } from "./schema";

export interface ScheduleResult {
  itemId: string;
  month: Month | null;
}

/**
 * Walks `items` in order and places each into the earliest month (within
 * `horizonMonths`, default 12) where its bucket still has room under the
 * plan's allocation and, for wants, the 30-day cooldown has lifted.
 * `today` is passed in (never computed internally) for the cooldown check.
 *
 * Simplification: this only enforces the bucket-limit constraint (which is
 * exactly the `wants-limit` default guard rule) and the cooldown — it does
 * not run the emergency-fund-floor or installment-cap guards, since those
 * need a savings balance and a 12-month installment projection that aren't
 * inputs to a pure scheduling pass. A screen presenting a specific draft
 * (flow 1 in SPEC) still runs the full `evaluateGuards` before confirming.
 */
export function scheduleQueue(
  items: QueueItem[],
  profile: Profile,
  planState: PlanState,
  existingCommitments: Commitment[],
  today: string,
  startMonth: Month,
  horizonMonths = 12,
): ScheduleResult[] {
  const bucketLimits = currentAllocation(profile, planState);
  const income = netMonthlyIncome(profile);
  const ledger: Commitment[] = [...existingCommitments];
  const results: ScheduleResult[] = [];

  const orderedItems = [...items].sort((a, b) => a.order - b.order);

  for (const item of orderedItems) {
    let placedMonth: Month | null = null;

    for (let offset = 0; offset < horizonMonths; offset++) {
      const candidateMonth = addMonths(startMonth, offset);

      if (!item.isNeed) {
        const candidateDate = `${candidateMonth}-01`;
        if (cooldownStatus(item, candidateDate).active) continue;
      }

      const draft = toDraftCommitment(item, candidateMonth);
      const projection = project({ income }, [...ledger, draft], candidateMonth, {
        includeDrafts: true,
        bucketLimits,
      });
      const bucket = projection.byBucket[item.isNeed ? "needs" : "wants"];

      if (bucket.committed <= bucket.limit) {
        placedMonth = candidateMonth;
        ledger.push({ ...draft, status: "active" });
        break;
      }
    }

    results.push({ itemId: item.id, month: placedMonth });
  }

  return results;
}
