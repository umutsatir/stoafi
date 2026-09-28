import { z } from "zod";

export const PlanStateSchema = z.object({
  strategyId: z.string(),
  params: z.unknown(),
});

export type PlanStateInput = z.infer<typeof PlanStateSchema>;
