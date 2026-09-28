import { z } from "zod";

export const BUCKETS = ["needs", "wants", "savings", "investing"] as const;
export type Bucket = (typeof BUCKETS)[number];

export const BucketSchema = z.enum(BUCKETS);
