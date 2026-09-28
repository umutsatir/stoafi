import type { Module } from "../../kernel/module";
import { InstallmentOfferSchema } from "./schema";
import { capacityRemaining, installmentLoadTimeline } from "./capacity";
import { compareOffers, monthlyRate, pvOfPlan, realSaving } from "./selectors";

export const installmentsModule: Module<typeof InstallmentOfferSchema> = {
  id: "installments",
  version: 1,
  schema: InstallmentOfferSchema,
  migrations: [],
  selectors: {
    monthlyRate,
    pvOfPlan,
    realSaving,
    compareOffers,
    installmentLoadTimeline,
    capacityRemaining,
  },
};
