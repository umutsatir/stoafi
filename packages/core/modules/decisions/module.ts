import type { Module } from "../../kernel/module";
import { DecisionSchema } from "./schema";
import { savingsSummary } from "./selectors";

export const decisionsModule: Module<typeof DecisionSchema> = {
  id: "decisions",
  version: 1,
  schema: DecisionSchema,
  migrations: [],
  selectors: {
    savingsSummary,
  },
};
