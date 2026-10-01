import { z } from "zod";

const DECISION_OUTCOMES = ["bought", "postponed", "skipped"] as const;
export type DecisionOutcome = (typeof DECISION_OUTCOMES)[number];

export const DecisionSchema = z
  .object({
    id: z.string(),
    queueItemRef: z.string(),
    /** The item's name at decision time, so the log still reads well after the item is deleted. Optional for older records. */
    itemName: z.string().optional(),
    outcome: z.enum(DECISION_OUTCOMES),
    /** Always passed in, never generated internally. */
    timestamp: z.string(),
    amount: z.number().int(),
    /** Guard rule ids this decision breached, if any. */
    breachedRuleIds: z.array(z.string()).optional(),
    /** Required "I know" confirmation when `breachedRuleIds` is non-empty. */
    guardBreachConfirmed: z.boolean().optional(),
  })
  .refine(
    (decision) =>
      (decision.breachedRuleIds?.length ?? 0) === 0 || decision.guardBreachConfirmed === true,
    {
      message: "guardBreachConfirmed must be true when breachedRuleIds is non-empty",
      path: ["guardBreachConfirmed"],
    },
  );

export type Decision = z.infer<typeof DecisionSchema>;
