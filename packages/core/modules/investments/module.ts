import type { Module } from "../../kernel/module";
import { HoldingSchema } from "./schema";
import {
  addTrade,
  allocationByType,
  averageCost,
  costBasis,
  holdingQuantity,
  marketValue,
  portfolioTotals,
  priceStaleDays,
  realReturn,
  realizedPnL,
  removeTrade,
  unrealizedPnL,
} from "./selectors";

export const investmentsModule: Module<typeof HoldingSchema> = {
  id: "investments",
  version: 1,
  schema: HoldingSchema,
  migrations: [],
  selectors: {
    addTrade,
    allocationByType,
    averageCost,
    costBasis,
    holdingQuantity,
    marketValue,
    portfolioTotals,
    priceStaleDays,
    realReturn,
    realizedPnL,
    removeTrade,
    unrealizedPnL,
  },
};
