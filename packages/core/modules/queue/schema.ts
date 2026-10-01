import { z } from "zod";
import { MonthSchema } from "../../kernel/month";
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
  /**
   * Set once the item was bought in installments: the chosen offer and the month
   * of its first payment. The item then leaves the waiting queue and its payments
   * become an installment commitment (derived, see installment-purchase.ts).
   * Additive and optional, so existing stored items stay valid.
   */
  installmentPurchase: z
    .object({
      offer: InstallmentOfferSchema,
      firstMonth: MonthSchema,
      /** The card the purchase was made with; its remaining payments count against that card's limit. */
      cardId: z.string().optional(),
    })
    .optional(),
  /** Manual drag-and-drop order, lower comes first. */
  order: z.number().int(),
});

export type QueueItem = z.infer<typeof QueueItemSchema>;
