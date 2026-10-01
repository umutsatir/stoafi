import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Profile } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { MoneyFlowSummary } from "./money-flow-summary";
import { ProfileOverview } from "./profile-overview";

const profile: Profile = {
  incomes: [{ label: "Job", monthly: 6_000_000 }],
  fixedExpenses: [
    { label: "Rent", monthly: 1_800_000, bucket: "needs" },
    { label: "Old loan", monthly: 500_000, bucket: "needs", endMonth: "2026-08" },
  ],
  livingExpenses: 1_200_000,
  savings: 9_000_000,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

describe("ProfileOverview", () => {
  it("shows income, the value of an hour and how far the emergency fund is", () => {
    renderWithIntl(<ProfileOverview profile={profile} month="2026-10" />);
    expect(screen.getByTestId("overview-income")).toHaveTextContent("₺60,000.00");
    // 60,000 over 160 working hours = 375 an hour
    expect(screen.getByTestId("overview-hour")).toHaveTextContent("₺375.00");
    // needs: rent 18,000 + living 12,000 = 30,000; 90,000 saved = 3 months of 6
    expect(screen.getByTestId("overview-fund")).toHaveTextContent("3.0 of 6 months");
    expect(screen.getByRole("progressbar", { name: "Emergency fund progress" })).toHaveTextContent(
      "50%",
    );
    expect(screen.getByRole("link", { name: "Add money to it" })).toHaveAttribute(
      "href",
      "/sinking-funds",
    );
  });

  it("does not divide by zero for someone with no needs yet", () => {
    renderWithIntl(
      <ProfileOverview
        profile={{ ...profile, fixedExpenses: [], livingExpenses: 0, savings: 0 }}
        month="2026-10"
      />,
    );
    expect(screen.getByTestId("overview-fund")).toHaveTextContent("0.0 of 6 months");
  });
});

describe("MoneyFlowSummary", () => {
  it("adds money in, money out and what is left, skipping expenses that have ended", () => {
    renderWithIntl(
      <MoneyFlowSummary profile={profile} month="2026-10" installmentsThisMonth={800_000} />,
    );
    expect(screen.getByTestId("flow-in")).toHaveTextContent("₺60,000.00");
    // 18,000 rent + 12,000 living + 8,000 installments
    expect(screen.getByTestId("flow-out")).toHaveTextContent("₺38,000.00");
    expect(screen.getByTestId("flow-left")).toHaveTextContent("₺22,000.00");
  });

  it("says so when more goes out than comes in", () => {
    renderWithIntl(
      <MoneyFlowSummary profile={profile} month="2026-10" installmentsThisMonth={9_000_000} />,
    );
    expect(screen.getByTestId("flow-left")).toHaveTextContent("−₺60,000.00");
    expect(screen.getByText("You spend more than you earn this month")).toBeInTheDocument();
  });

  it("counts saving and investing lines as money out, like any other recurring line", () => {
    renderWithIntl(
      <MoneyFlowSummary
        profile={{
          ...profile,
          fixedExpenses: [{ label: "Fund", monthly: 500_000, bucket: "investing" }],
          livingExpenses: 0,
        }}
        month="2026-10"
        installmentsThisMonth={0}
      />,
    );
    expect(screen.getByTestId("flow-out")).toHaveTextContent("₺5,000.00");
  });
});
