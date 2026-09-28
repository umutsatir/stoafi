import type { Module } from "../../kernel/module";
import { ProfileSchema } from "./schema";
import { hourlyNetIncome, netMonthlyIncome } from "./selectors";

export const profileModule: Module<typeof ProfileSchema> = {
  id: "profile",
  version: 1,
  schema: ProfileSchema,
  migrations: [],
  selectors: {
    hourlyNetIncome,
    netMonthlyIncome,
  },
};
