import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Commitment, PlanStateInput, Profile } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { PlanUsage } from "./plan-usage";

const profile: Profile = {
  incomes: [{ label: "Job", monthly: 10_000_000 }],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};
const plan: PlanStateInput = { strategyId: "fifty-thirty-twenty", params: {} };
const commitment = (bucket: "needs" | "wants", amount: number): Commitment => ({
  id: `c-${bucket}`,
  source: { module: "profile", refId: bucket },
  bucket,
  payments: [{ month: "2026-10", amount }],
  status: "active",
});

describe("PlanUsage", () => {
  it("names the active plan and shows each bucket's use against its limit", () => {
    renderWithIntl(
      <PlanUsage
        profile={profile}
        planState={plan}
        ledger={[commitment("needs", 2_000_000)]}
        month="2026-10"
      />,
    );
    expect(screen.getByTestId("active-plan-name")).toHaveTextContent("The 50/30/20 rule");
    // 50/30/20 of 100,000: needs limit 50,000
    expect(screen.getByTestId("usage-needs")).toHaveTextContent("₺20,000.00 / ₺50,000.00");
    expect(screen.getByTestId("usage-wants")).toHaveTextContent("₺0.00 / ₺30,000.00");
  });

  it("explains each bucket in an (i) popover", () => {
    renderWithIntl(<PlanUsage profile={profile} planState={plan} ledger={[]} month="2026-10" />);
    expect(screen.getByRole("button", { name: "What is Needs?" })).toBeInTheDocument();
    expect(screen.getAllByRole("progressbar")).toHaveLength(4);
  });

  it("flags a bucket that is over its limit", () => {
    renderWithIntl(
      <PlanUsage
        profile={profile}
        planState={plan}
        ledger={[commitment("wants", 4_000_000)]}
        month="2026-10"
      />,
    );
    expect(screen.getByRole("progressbar", { name: "Wants used this month" })).toHaveAttribute(
      "aria-valuenow",
      "3000000",
    );
  });

  it("opens the investing lesson in a panel, only when there is money for investing", async () => {
    const { unmount } = renderWithIntl(
      <PlanUsage profile={profile} planState={plan} ledger={[]} month="2026-10" />,
    );
    expect(screen.queryByTestId("lesson-link-investing-bucket")).not.toBeInTheDocument();
    unmount();

    renderWithIntl(
      <PlanUsage
        profile={profile}
        planState={{ strategyId: "conscious-spending", params: {} }}
        ledger={[]}
        month="2026-10"
      />,
    );
    fireEvent.click(screen.getByTestId("lesson-link-investing-bucket"));
    const panel = await screen.findByRole("dialog", { name: "Index funds and costs" });
    expect(within(panel).getByText(/Bogle/)).toBeInTheDocument();
  });
});
