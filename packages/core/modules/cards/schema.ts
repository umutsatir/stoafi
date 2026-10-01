import { z } from "zod";

export const CARD_NETWORKS = ["visa", "mastercard", "troy", "amex", "other"] as const;
export type CardNetwork = (typeof CARD_NETWORKS)[number];

/**
 * A payment card. The first four fields are the original shape; everything after is
 * optional, so cards saved before supplementary cards existed stay valid.
 */
export const CardSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    statementDay: z.number().int().min(1).max(31),
    dueDay: z.number().int().min(1).max(31),
    /** Missing reads as a main card. */
    kind: z.enum(["main", "supplementary"]).optional(),
    /** A supplementary card's main card. */
    parentId: z.string().optional(),
    /** The credit limit, on main cards only: supplementary cards share it. */
    limit: z.number().int().nonnegative().optional(),
    /** What the user says is currently owed on this card, entered by hand. */
    currentDebt: z.number().int().nonnegative().optional(),
    /** A bank preset id (see banks.ts). */
    bankId: z.string().optional(),
    network: z.enum(CARD_NETWORKS).optional(),
    /** Optional, and only ever the last four digits. */
    last4: z
      .string()
      .regex(/^\d{4}$/)
      .optional(),
    /** A custom colour (hex) for cards without a bank preset. */
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .optional(),
  })
  .superRefine((card, ctx) => {
    const supplementary = card.kind === "supplementary";
    if (supplementary && card.parentId === undefined) {
      ctx.addIssue({ code: "custom", path: ["parentId"], message: "needs a main card" });
    }
    if (!supplementary && card.parentId !== undefined) {
      ctx.addIssue({ code: "custom", path: ["parentId"], message: "only supplementary cards" });
    }
    if (supplementary && card.limit !== undefined) {
      ctx.addIssue({ code: "custom", path: ["limit"], message: "shares the main card's limit" });
    }
  });

export type Card = z.infer<typeof CardSchema>;
