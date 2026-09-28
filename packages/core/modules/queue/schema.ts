import { z } from "zod";
import { InstallmentOfferSchema } from "../installments/schema";

export const QueueItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().int().nonnegative(),
  discountedCashPrice: z.number().int().nonnegative().optional(),
  installmentOffers: z.array(InstallmentOfferSchema).optional(),
  urgency: z.number().int().min(1).max(3),
  importance: z.number().int().min(1).max(3),
  isNeed: z.boolean(),
  expectedUses: z.number().nonnegative(),
  addedDate: z.string(),
  priceUpdatedDate: z.string(),
  /** Manual drag-and-drop order, lower comes first. */
  order: z.number().int(),
});

export type QueueItem = z.infer<typeof QueueItemSchema>;
