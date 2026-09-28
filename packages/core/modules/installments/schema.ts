import { z } from "zod";

export const InstallmentOfferSchema = z.object({
  months: z.number().int().positive(),
  payments: z.array(z.number().int().positive()).min(1),
  discountedCashPrice: z.number().int().nonnegative().optional(),
});

export type InstallmentOfferInput = z.infer<typeof InstallmentOfferSchema>;
