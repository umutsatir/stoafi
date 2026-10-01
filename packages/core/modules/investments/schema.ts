import { z } from "zod";

export const TradeSchema = z.object({
  id: z.string(),
  /** YYYY-MM-DD */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  side: z.enum(["buy", "sell"]),
  /** Units bought or sold. Not money, so it may be fractional (0.35 g of gold). */
  quantity: z.number().positive(),
  /** Price of one unit, in minor units. */
  unitPrice: z.number().int().nonnegative(),
  /** Broker or exchange fee for this trade, in minor units. */
  fee: z.number().int().nonnegative().optional(),
  note: z.string().optional(),
});

export type Trade = z.infer<typeof TradeSchema>;

/** One thing the user owns, with every purchase and sale of it. */
export const HoldingSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** A preset type id (see types.ts), or "custom" together with `customType`. */
  typeId: z.string(),
  customType: z.string().optional(),
  /** What one unit is called: g, lot, share. */
  unitLabel: z.string().optional(),
  /** What one unit is worth now, typed in by the user; the app never looks prices up. */
  currentPrice: z.number().int().nonnegative().optional(),
  /** YYYY-MM-DD the price was entered. */
  priceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  trades: z.array(TradeSchema),
});

export type Holding = z.infer<typeof HoldingSchema>;
