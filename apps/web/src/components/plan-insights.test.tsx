import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildLedger } from "@/store/ledger";
import type { Profile } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { PlanInsights } from "./plan-insights";

const base: Profile = {
  incomes: [{ label: "Job", monthly: 1_000_000 }],
  fixedExpenses: [{ label: "Rent", monthly: 200_000, bucket: "needs" }],
  livingExpenses: 100_000,
  savings: 10_000_000,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

function renderInsights(
  profile: Profile,
  strategyId = "fifty-thirty-twenty",
  locale: "en" | "tr" = "en",
) {
  return renderWithIntl(
    <PlanInsights
      profile={profile}
      planState={{ strategyId, params: {} }}
      ledger={buildLedger(profile, [], "2026-10")}
      month="2026-10"
    />,
    locale,
  );
}

describe("PlanInsights", () => {
  it("says all is clear when the plan fits", () => {
    renderInsights(base);
    expect(
      screen.getByText("Your plan fits your numbers for the next 12 months."),
    ).toBeInTheDocument();
  });

  it("flags a wants limit that recurring costs already exceed, once, with its months", () => {
    // wants limit is 30% of 10,000.00 = 3,000.00; a 4,000.00 subscription-like cost is over it every month.
    const overspent: Profile = {
      ...base,
      fixedExpenses: [
        ...base.fixedExpenses,
        { label: "Gym club", monthly: 400_000, bucket: "wants" },
      ],
    };
    renderInsights(overspent);
    const items = screen.getAllByTestId("plan-insight");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("above this plan's wants limit");
    expect(items[0]).toHaveTextContent("2026-10–2027-09");
  });

  it("stops flagging months after an expense ends", () => {
    const ending: Profile = {
      ...base,
      fixedExpenses: [
        ...base.fixedExpenses,
        { label: "Gym club", monthly: 400_000, bucket: "wants", endMonth: "2026-11" },
      ],
    };
    renderInsights(ending);
    expect(screen.getByTestId("plan-insight")).toHaveTextContent("2026-10, 2026-11");
  });

  it("explains that only tracked set-asides count for Pay Yourself First", () => {
    renderInsights(base, "pay-yourself-first");
    expect(screen.getByTestId("plan-insight")).toHaveTextContent("Savings goals");
  });

  it("shows the Baby Steps stage as its own line", () => {
    renderInsights({ ...base, savings: 0 }, "baby-steps");
    expect(screen.getByTestId("plan-insight")).toHaveTextContent("Step 1");
  });

  it("is translated", () => {
    renderInsights(base, "fifty-thirty-twenty", "tr");
    expect(screen.queryByText("Your plan fits your numbers for the next 12 months.")).toBeNull();
    expect(screen.getByTestId("plan-insights")).toBeInTheDocument();
  });

  it("links to the strategy's lesson", () => {
    renderInsights(base);
    expect(screen.getByTestId("lesson-link-plan-insights")).toHaveAttribute(
      "href",
      "/lessons#fifty-thirty-twenty",
    );
  });

  it("renders nothing for an unknown strategy", () => {
    const { container } = renderInsights(base, "does-not-exist");
    expect(container).toBeEmptyDOMElement();
  });
});
