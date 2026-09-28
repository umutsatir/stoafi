import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Profile } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { PlanComparison } from "./plan-comparison";

const profile: Profile = {
  incomes: [{ label: "Salary", monthly: 10000 }],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

describe("PlanComparison", () => {
  it("renders all 4 strategy cards with correct bucket amounts", () => {
    renderWithIntl(<PlanComparison profile={profile} />);

    for (const strategyId of [
      "fifty-thirty-twenty",
      "pay-yourself-first",
      "conscious-spending",
      "baby-steps",
    ]) {
      expect(screen.getByTestId(`strategy-${strategyId}`)).toBeInTheDocument();
    }

    // 50/30/20 on 10000 income: needs 5000, wants 3000, savings 2000.
    const fiftyThirtyTwenty = screen.getByTestId("strategy-fifty-thirty-twenty");
    expect(fiftyThirtyTwenty).toHaveTextContent("5000");
    expect(fiftyThirtyTwenty).toHaveTextContent("3000");
  });

  it("links each strategy to its lesson card content", () => {
    renderWithIntl(<PlanComparison profile={profile} />);
    expect(screen.getByLabelText("fifty-thirty-twenty lesson")).toBeInTheDocument();
    expect(screen.getByText(/Elizabeth Warren/)).toBeInTheDocument();
  });

  it("marks the active plan and lets the user switch to another", () => {
    const onSelect = vi.fn();
    renderWithIntl(
      <PlanComparison
        profile={profile}
        activeStrategyId="fifty-thirty-twenty"
        onSelect={onSelect}
      />,
    );

    const active = within(screen.getByTestId("strategy-fifty-thirty-twenty"));
    expect(active.getByRole("button", { name: "Active plan" })).toBeDisabled();

    const other = within(screen.getByTestId("strategy-pay-yourself-first"));
    fireEvent.click(other.getByRole("button", { name: "Use this plan" }));
    expect(onSelect).toHaveBeenCalledWith("pay-yourself-first");
  });

  it("shows no plan buttons when the comparison is read-only", () => {
    renderWithIntl(<PlanComparison profile={profile} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
