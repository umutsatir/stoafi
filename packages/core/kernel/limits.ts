import { BUCKETS, type Bucket } from "./bucket";
import type { Minor } from "./money";
import type { MonthProjection } from "./projection";

export type LimitState = "ok" | "tight" | "over";

export interface LimitStatus {
  bucket: Bucket;
  limit: Minor;
  committed: Minor;
  /** Limit minus committed; negative when over. */
  remaining: Minor;
  overBy: Minor;
  /** committed / limit, 0 when there is no limit. */
  usedFraction: number;
  state: LimitState;
}

/** Past this share of a limit the bucket is "tight"; the same line the Plan page uses for its bars. */
const TIGHT_FROM = 0.85;

/** Where each bucket stands this month against its plan limit. */
export function limitStatuses(projection: MonthProjection): LimitStatus[] {
  return BUCKETS.map((bucket) => {
    const { limit, committed } = projection.byBucket[bucket];
    const usedFraction = limit > 0 ? committed / limit : 0;
    const overBy = Math.max(0, committed - limit);
    const state: LimitState = overBy > 0 ? "over" : usedFraction > TIGHT_FROM ? "tight" : "ok";
    return { bucket, limit, committed, remaining: limit - committed, overBy, usedFraction, state };
  });
}

export type LimitAdvice =
  | { id: "needsOver" | "wantsOver"; bucket: Bucket; amount: Minor }
  | { id: "wantsRoom"; bucket: "wants"; amount: Minor; count: number }
  | { id: "wantsSpare"; bucket: "wants"; amount: Minor }
  | { id: "savingsToSet" | "investingToSet"; bucket: Bucket; amount: Minor }
  | { id: "allGood" };

/**
 * What to do about this month's limits, as ids the screen turns into sentences.
 * `queueFits` is how many waiting wants the scheduler already places in this month.
 * Savings and investing going over their limit is good news, so only a shortfall is reported there.
 */
export function limitAdvice(projection: MonthProjection, queueFits: number): LimitAdvice[] {
  const byBucket = new Map(limitStatuses(projection).map((s) => [s.bucket, s]));
  const advice: LimitAdvice[] = [];
  const get = (b: Bucket): LimitStatus => byBucket.get(b) as LimitStatus; // every bucket is in the map

  const needs = get("needs");
  if (needs.overBy > 0) advice.push({ id: "needsOver", bucket: "needs", amount: needs.overBy });

  const wants = get("wants");
  if (wants.overBy > 0) advice.push({ id: "wantsOver", bucket: "wants", amount: wants.overBy });
  else if (wants.remaining > 0) {
    advice.push(
      queueFits > 0
        ? { id: "wantsRoom", bucket: "wants", amount: wants.remaining, count: queueFits }
        : { id: "wantsSpare", bucket: "wants", amount: wants.remaining },
    );
  }

  const savings = get("savings");
  if (savings.remaining > 0) {
    advice.push({ id: "savingsToSet", bucket: "savings", amount: savings.remaining });
  }
  const investing = get("investing");
  if (investing.remaining > 0) {
    advice.push({ id: "investingToSet", bucket: "investing", amount: investing.remaining });
  }

  return advice.length > 0 ? advice : [{ id: "allGood" }];
}
