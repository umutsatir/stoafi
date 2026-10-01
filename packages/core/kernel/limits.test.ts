import { describe, expect, it } from "vitest";
import { limitAdvice, limitStatuses } from "./limits";
import type { MonthProjection } from "./projection";

function projection(
  by: Partial<Record<"needs" | "wants" | "savings" | "investing", [number, number]>>,
) {
  const pair = (b: keyof typeof by): { limit: number; committed: number } => {
    const [limit, committed] = by[b] ?? [0, 0];
    return { limit, committed };
  };
  return {
    month: "2026-10",
    income: 1_000_000,
    byBucket: {
      needs: pair("needs"),
      wants: pair("wants"),
      savings: pair("savings"),
      investing: pair("investing"),
    },
    installmentLoad: 0,
    sinkingSetAside: 0,
    freeCash: 0,
  } satisfies MonthProjection;
}

describe("limitStatuses", () => {
  it("says how much is left in each bucket, and by how much one is over", () => {
    const s = limitStatuses(projection({ needs: [500_000, 520_000], wants: [300_000, 100_000] }));
    const needs = s.find((x) => x.bucket === "needs");
    const wants = s.find((x) => x.bucket === "wants");
    expect(needs).toMatchObject({ remaining: -20_000, overBy: 20_000, state: "over" });
    expect(wants).toMatchObject({ remaining: 200_000, overBy: 0, state: "ok" });
  });

  it("calls a bucket tight once more than 85% is used, and exactly at the limit is not over", () => {
    const s = limitStatuses(projection({ needs: [100_000, 90_000], wants: [100_000, 100_000] }));
    expect(s.find((x) => x.bucket === "needs")?.state).toBe("tight");
    expect(s.find((x) => x.bucket === "wants")?.state).toBe("tight");
  });

  it("handles a zero limit without dividing by zero", () => {
    const s = limitStatuses(projection({ wants: [0, 0], needs: [0, 5_000] }));
    expect(s.find((x) => x.bucket === "wants")).toMatchObject({ usedFraction: 0, state: "ok" });
    expect(s.find((x) => x.bucket === "needs")).toMatchObject({ overBy: 5_000, state: "over" });
  });
});

describe("limitAdvice", () => {
  it("tells what to do for a bucket that is over", () => {
    const a = limitAdvice(projection({ needs: [500_000, 520_000], wants: [300_000, 350_000] }), 0);
    expect(a).toContainEqual({ id: "needsOver", bucket: "needs", amount: 20_000 });
    expect(a).toContainEqual({ id: "wantsOver", bucket: "wants", amount: 50_000 });
  });

  it("points at the queue when wants have room and something fits", () => {
    const a = limitAdvice(projection({ wants: [300_000, 100_000] }), 2);
    expect(a).toContainEqual({ id: "wantsRoom", bucket: "wants", amount: 200_000, count: 2 });
  });

  it("just reports spare wants money when nothing in the queue fits", () => {
    const a = limitAdvice(projection({ wants: [300_000, 100_000] }), 0);
    expect(a).toContainEqual({ id: "wantsSpare", bucket: "wants", amount: 200_000 });
  });

  it("says how much is still to put into savings and investing", () => {
    const a = limitAdvice(
      projection({ savings: [200_000, 50_000], investing: [100_000, 100_000] }),
      0,
    );
    expect(a).toContainEqual({ id: "savingsToSet", bucket: "savings", amount: 150_000 });
    expect(a.some((x) => x.id === "investingToSet")).toBe(false);
  });

  it("says all is well when nothing needs doing", () => {
    expect(limitAdvice(projection({}), 0)).toEqual([{ id: "allGood" }]);
  });
});
