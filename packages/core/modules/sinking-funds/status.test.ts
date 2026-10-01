import { describe, expect, it } from "vitest";
import { projectSeries } from "../../kernel/project";
import type { Month } from "../../kernel/month";
import { sinkingFundCommitments, sinkingFundStatus } from "./status";
import type { SinkingFund } from "./schema";

function fund(overrides: Partial<SinkingFund> = {}): SinkingFund {
  return {
    id: "f1",
    label: "Car insurance",
    target: 600_000,
    dueMonth: "2027-03",
    currentBalance: 0,
    ...overrides,
  };
}

describe("sinkingFundStatus", () => {
  it("is active with an even monthly set-aside while the due month is ahead", () => {
    // 6,000.00 over the 6 months from 2026-10 to 2027-03 (payments run from next month)
    expect(sinkingFundStatus(fund({ dueMonth: "2027-04" }), "2026-10")).toEqual({
      state: "active",
      monthsRemaining: 6,
      monthlySetAside: 100_000,
    });
  });

  it("counts what is already saved", () => {
    const status = sinkingFundStatus(
      fund({ dueMonth: "2027-04", currentBalance: 300_000 }),
      "2026-10",
    );
    expect(status).toMatchObject({ state: "active", monthlySetAside: 50_000 });
  });

  it("is funded once the balance reaches the target, however far the due month", () => {
    expect(sinkingFundStatus(fund({ currentBalance: 600_000 }), "2026-10").state).toBe("funded");
    expect(sinkingFundStatus(fund({ currentBalance: 900_000 }), "2026-10").state).toBe("funded");
  });

  it("treats a zero target as funded", () => {
    expect(sinkingFundStatus(fund({ target: 0 }), "2026-10").state).toBe("funded");
  });

  it("is due, with what is still missing, in the due month itself", () => {
    expect(
      sinkingFundStatus(fund({ dueMonth: "2026-10", currentBalance: 250_000 }), "2026-10"),
    ).toEqual({ state: "due", monthsRemaining: 0, missing: 350_000 });
  });

  it("is overdue, with what is still missing, after the due month", () => {
    expect(sinkingFundStatus(fund({ dueMonth: "2026-08" }), "2026-10")).toEqual({
      state: "overdue",
      monthsRemaining: -2,
      missing: 600_000,
    });
  });

  it("is still funded, not overdue, when the money was saved in time", () => {
    expect(
      sinkingFundStatus(fund({ dueMonth: "2026-08", currentBalance: 600_000 }), "2026-10").state,
    ).toBe("funded");
  });

  it("rounds an uneven set-aside half to even instead of leaving fractions", () => {
    const status = sinkingFundStatus(fund({ target: 100_001, dueMonth: "2027-01" }), "2026-10");
    expect(status).toMatchObject({ state: "active", monthsRemaining: 3 });
    expect(Number.isInteger((status as { monthlySetAside: number }).monthlySetAside)).toBe(true);
  });
});

describe("sinkingFundCommitments", () => {
  it("makes one commitment per fund with months left and skips due or overdue ones", () => {
    const funds = [
      fund({ id: "ahead", dueMonth: "2027-04" }),
      fund({ id: "due", dueMonth: "2026-10" }),
      fund({ id: "late", dueMonth: "2026-08" }),
    ];
    expect(sinkingFundCommitments(funds, "2026-10").map((c) => c.id)).toEqual(["ahead"]);
  });

  it("starts next month and raises the projection's set-aside only in those months", () => {
    const commitments = sinkingFundCommitments([fund({ dueMonth: "2026-12" })], "2026-10");
    const months: Month[] = ["2026-10", "2026-11", "2026-12", "2027-01"];
    const series = projectSeries({ income: 1_000_000 }, commitments, months);
    expect(series.map((p) => p.sinkingSetAside)).toEqual([0, 300_000, 300_000, 0]);
  });

  it("is empty with no funds", () => {
    expect(sinkingFundCommitments([], "2026-10")).toEqual([]);
  });
});

describe("open pots without a due date", () => {
  const open = {
    id: "o",
    label: "Rainy day",
    target: 0,
    currentBalance: 50_000,
  };

  it("are open: nothing is asked each month and they never become overdue", () => {
    expect(sinkingFundStatus(open, "2026-10")).toEqual({ state: "open" });
    expect(sinkingFundStatus(open, "2040-01")).toEqual({ state: "open" });
  });

  it("are funded once a target they do have is reached", () => {
    expect(sinkingFundStatus({ ...open, target: 40_000 }, "2026-10").state).toBe("funded");
    expect(sinkingFundStatus({ ...open, target: 90_000 }, "2026-10").state).toBe("open");
  });

  it("add nothing to the monthly ledger", () => {
    expect(sinkingFundCommitments([open], "2026-10")).toEqual([]);
  });
});
