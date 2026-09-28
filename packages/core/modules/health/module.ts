import { z } from "zod";
import type { Module } from "../../kernel/module";
import { emergencyFundMonths, installmentRatio, runway, savingsRate } from "./selectors";

/** health owns no persisted data (SPEC: "Owns: –"); schema is an empty no-op. */
const EmptySchema = z.object({});

export const healthModule: Module<typeof EmptySchema> = {
  id: "health",
  version: 1,
  schema: EmptySchema,
  migrations: [],
  selectors: {
    savingsRate,
    installmentRatio,
    emergencyFundMonths,
    runway,
  },
};
