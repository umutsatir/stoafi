import type { Module } from "../../kernel/module";
import { CardSchema } from "./schema";
import { timingTip } from "./timing";
import { minimumPaymentPayoff } from "./minimum-payment";

export const cardsModule: Module<typeof CardSchema> = {
  id: "cards",
  version: 1,
  schema: CardSchema,
  migrations: [],
  selectors: {
    timingTip,
    minimumPaymentPayoff,
  },
};
