import { describe, expect, it } from "vitest";
import { MonthProjectionSchema, type MonthProjection } from "./projection";

describe("MonthProjectionSchema", () => {
  it("parses a value satisfying the MonthProjection type", () => {
    const projection: MonthProjection = {
      month: "2026-09",
      income: 50000,
      byBucket: {
        needs: { limit: 25000, committed: 20000 },
        wants: { limit: 15000, committed: 10000 },
        savings: { limit: 10000, committed: 10000 },
        investing: { limit: 0, committed: 0 },
      },
      installmentLoad: 5000,
      sinkingSetAside: 1000,
      freeCash: 4000,
    };

    expect(MonthProjectionSchema.safeParse(projection).success).toBe(true);
  });
});
