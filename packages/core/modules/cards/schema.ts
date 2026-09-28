import { z } from "zod";

export const CardSchema = z.object({
  id: z.string(),
  label: z.string(),
  statementDay: z.number().int().min(1).max(31),
  dueDay: z.number().int().min(1).max(31),
});

export type Card = z.infer<typeof CardSchema>;
