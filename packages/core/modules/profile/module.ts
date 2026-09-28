import type { Module } from "../../kernel/module";
import { ProfileSchema } from "./schema";
import { migrateProfileV1ToV2 } from "./migrations";
import { hourlyNetIncome, monthlyNeeds, netMonthlyIncome } from "./selectors";

export const profileModule: Module<typeof ProfileSchema> = {
  id: "profile",
  version: 2,
  schema: ProfileSchema,
  migrations: [migrateProfileV1ToV2],
  selectors: {
    hourlyNetIncome,
    monthlyNeeds,
    netMonthlyIncome,
  },
};
