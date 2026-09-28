import { z } from "zod";
import { BUCKETS, type Bucket } from "./bucket";
import { type Minor } from "./money";
import { MonthSchema, type Month } from "./month";

/**
 * A month's derived numbers. Never persisted — recomputed on every change
 * from profile, plan and the commitment ledger.
 */
export interface MonthProjection {
  month: Month;
  income: Minor;
  byBucket: Record<Bucket, { limit: Minor; committed: Minor }>;
  installmentLoad: Minor;
  sinkingSetAside: Minor;
  freeCash: Minor;
}

const bucketAmounts = z.object({
  limit: z.number().int(),
  committed: z.number().int(),
});

export const MonthProjectionSchema = z.object({
  month: MonthSchema,
  income: z.number().int(),
  byBucket: z.object(
    Object.fromEntries(BUCKETS.map((b) => [b, bucketAmounts])),
  ) as unknown as z.ZodType<Record<Bucket, { limit: Minor; committed: Minor }>>,
  installmentLoad: z.number().int(),
  sinkingSetAside: z.number().int(),
  freeCash: z.number().int(),
}) satisfies z.ZodType<MonthProjection>;
