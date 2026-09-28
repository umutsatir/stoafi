import type { Module } from "../../kernel/module";
import { SinkingFundSchema, toCommitment } from "./schema";
import { monthlySetAside } from "./selectors";

export const sinkingFundsModule: Module<typeof SinkingFundSchema> = {
  id: "sinking-funds",
  version: 1,
  schema: SinkingFundSchema,
  migrations: [],
  selectors: {
    monthlySetAside,
    toCommitment,
  },
};
