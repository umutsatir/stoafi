import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Profile } from "@stoafi/core";
import { PlanComparison } from "./plan-comparison";

const profile: Profile = {
  incomes: [{ label: "Salary", monthly: 10000, variable: false }],
  fixedExpenses: [],
  avgVariableExpenses: [],
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

describe("PlanComparison", () => {
  it("renders all 4 strategy cards with correct bucket amounts", () => {
    render(<PlanComparison profile={profile} />);

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
    render(<PlanComparison profile={profile} />);
    expect(screen.getByLabelText("fifty-thirty-twenty lesson")).toBeInTheDocument();
    expect(screen.getByText(/Elizabeth Warren/)).toBeInTheDocument();
  });
});
