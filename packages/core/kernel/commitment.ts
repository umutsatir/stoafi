import { z } from "zod";
import { BUCKETS, type Bucket } from "./bucket";
import { type Minor } from "./money";
import { MonthSchema, type Month } from "./month";

const COMMITMENT_STATUSES = ["draft", "active", "done", "cancelled"] as const;
export type CommitmentStatus = (typeof COMMITMENT_STATUSES)[number];

export interface Commitment {
  id: string;
  source: { module: string; refId: string };
  bucket: Bucket;
  /** 1 entry = one-off purchase, N entries = an installment plan. */
  payments: { month: Month; amount: Minor }[];
  status: CommitmentStatus;
  cardId?: string;
}

export const CommitmentSchema = z.object({
  id: z.string(),
  source: z.object({
    module: z.string(),
    refId: z.string(),
  }),
  bucket: z.enum(BUCKETS),
  payments: z
    .array(
      z.object({
        month: MonthSchema,
        amount: z.number().int(),
      }),
    )
    .min(1),
  status: z.enum(COMMITMENT_STATUSES),
  cardId: z.string().optional(),
}) satisfies z.ZodType<Commitment>;
