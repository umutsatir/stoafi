import { BUCKETS, type Bucket } from "./bucket";
import type { Commitment } from "./commitment";
import type { Minor } from "./money";
import type { Month } from "./month";
import type { MonthProjection } from "./projection";

export interface ProjectOptions {
  /** Include draft-status commitments (preview mode). Defaults to false. */
  includeDrafts?: boolean;
  /** Bucket spending limits for the month; defaults to 0 for every bucket. */
  bucketLimits?: Record<Bucket, Minor>;
}

export interface ProjectionInput {
  income: Minor;
}

function zeroLimits(): Record<Bucket, Minor> {
  return Object.fromEntries(BUCKETS.map((b) => [b, 0])) as Record<Bucket, Minor>;
}

/**
 * Projects a single month's committed spend from a list of commitments.
 * Pure and deterministic: `month` and `options` are always passed in.
 */
export function project(
  input: ProjectionInput,
  commitments: Commitment[],
  month: Month,
  options: ProjectOptions = {},
): MonthProjection {
  const includeDrafts = options.includeDrafts ?? false;
  const bucketLimits = options.bucketLimits ?? zeroLimits();

  const committed: Record<Bucket, Minor> = zeroLimits();
  let installmentLoad = 0;
  let sinkingSetAside = 0;

  for (const commitment of commitments) {
    if (commitment.status === "draft" && !includeDrafts) continue;
    if (commitment.status === "cancelled") continue;

    for (const payment of commitment.payments) {
      if (payment.month !== month) continue;

      committed[commitment.bucket] += payment.amount;

      if (commitment.source.module === "installments") {
        installmentLoad += payment.amount;
      }
      if (commitment.source.module === "sinking-funds") {
        sinkingSetAside += payment.amount;
      }
    }
  }

  const totalCommitted = BUCKETS.reduce((sum, b) => sum + committed[b], 0);

  return {
    month,
    income: input.income,
    byBucket: Object.fromEntries(
      BUCKETS.map((b) => [b, { limit: bucketLimits[b], committed: committed[b] }]),
    ) as MonthProjection["byBucket"],
    installmentLoad,
    sinkingSetAside,
    freeCash: input.income - totalCommitted,
  };
}

/** Projects a series of months, e.g. a 12-month horizon. */
export function projectSeries(
  input: ProjectionInput,
  commitments: Commitment[],
  months: Month[],
  options: ProjectOptions = {},
): MonthProjection[] {
  return months.map((month) => project(input, commitments, month, options));
}
