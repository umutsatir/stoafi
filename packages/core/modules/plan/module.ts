import type { Module } from "../../kernel/module";
import { PlanStateSchema } from "./schema";
import { compareStrategies, currentAllocation } from "./selectors";

export const planModule: Module<typeof PlanStateSchema> = {
  id: "plan",
  version: 1,
  schema: PlanStateSchema,
  migrations: [],
  selectors: {
    currentAllocation,
    compareStrategies,
  },
};
