import type { Module } from "../../kernel/module";
import { defaultGuardRules, GuardThresholdsSchema } from "./schema";
import { evaluateGuards } from "./selectors";

export const guardsModule: Module<typeof GuardThresholdsSchema> = {
  id: "guards",
  version: 1,
  schema: GuardThresholdsSchema,
  migrations: [],
  selectors: {
    evaluateGuards,
  },
  contributes: {
    guards: defaultGuardRules,
  },
};
