import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Profile, QueueItem } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { Dashboard } from "./dashboard";

const planState = { strategyId: "fifty-thirty-twenty", params: {} };

const profile: Profile = {
  incomes: [
    { label: "Job", monthly: 800_000 },
    { label: "Partner", monthly: 200_000 },
  ],
  fixedExpenses: [{ label: "Rent", monthly: 200_000, bucket: "needs" }],
  livingExpenses: 300_000,
  savings: 1_800_000,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

function waiting(id: string, order: number, price = 10_000): QueueItem {
  return {
    id,
    name: id,
    price,
    urgency: 2,
    importance: 2,
    isNeed: true,
    expectedUses: 10,
    addedDate: "2020-01-01",
    priceUpdatedDate: "2020-01-01",
    order,
  };
}

function renderDashboard(overrides: Partial<Parameters<typeof Dashboard>[0]> = {}) {
  return renderWithIntl(
    <Dashboard
      profile={profile}
      planState={planState}
      queueItems={[]}
      today="2026-09-15"
      {...overrides}
    />,
  );
}

describe("Dashboard", () => {
  it("points a new user to income and expenses first and shows no numbers", () => {
    renderDashboard({ profile: null });
    expect(screen.getByRole("link", { name: "Add your income and expenses" })).toHaveAttribute(
      "href",
      "/income-expenses",
    );
    expect(screen.queryByTestId("this-month")).not.toBeInTheDocument();
  });

  it("shows this month's income, obligations, living costs and what is left", () => {
    renderDashboard();
    const month = within(screen.getByTestId("this-month"));
    expect(month.getByTestId("income")).toHaveTextContent("₺10,000.00");
    expect(month.getByTestId("obligations")).toHaveTextContent("₺2,000.00");
    expect(month.getByTestId("living")).toHaveTextContent("₺3,000.00");
    expect(month.getByTestId("installments")).toHaveTextContent("₺0.00");
    expect(month.getByTestId("left")).toHaveTextContent("₺5,000.00");
  });

  it("counts installments bought from the queue against what is left", () => {
    const bought: QueueItem = {
      ...waiting("Fridge", 0, 600_000),
      installmentPurchase: {
        offer: { months: 3, payments: [200_000, 200_000, 200_000] },
        firstMonth: "2026-09",
      },
    };
    renderDashboard({ queueItems: [bought] });
    expect(screen.getByTestId("installments")).toHaveTextContent("₺2,000.00");
    expect(screen.getByTestId("left")).toHaveTextContent("₺3,000.00");
  });

  it("warns when obligations exceed income", () => {
    renderDashboard({ profile: { ...profile, livingExpenses: 900_000 } });
    expect(screen.getByTestId("left")).toHaveTextContent("-₺1,000.00");
    expect(screen.getByRole("alert")).toHaveTextContent("Your monthly costs are above your income");
  });

  it("compares saved months of needs with the emergency fund target", () => {
    renderDashboard();
    // needs = rent 2,000 + living 3,000 = 5,000; savings 18,000 -> 3.6 months of a 6 month target
    expect(screen.getByTestId("emergency-fund")).toHaveTextContent("3.6");
    expect(screen.getByTestId("emergency-fund")).toHaveTextContent("6");
    expect(screen.getByRole("alert")).toHaveTextContent("below your target");
  });

  it("does not warn when everything is in order", () => {
    renderDashboard({ profile: { ...profile, savings: 5_000_000 } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("lists the next queue items with their scheduled month, in queue order", () => {
    renderDashboard({
      queueItems: [
        waiting("Headphones", 0),
        waiting("Desk", 1),
        waiting("Chair", 2),
        waiting("Lamp", 3),
      ],
    });
    const list = within(screen.getByTestId("next-items"));
    expect(list.getAllByRole("listitem")).toHaveLength(3);
    expect(list.getByText("Headphones")).toBeInTheDocument();
    expect(list.queryByText("Lamp")).not.toBeInTheDocument();
    expect(screen.getByTestId("next-month-Headphones")).toHaveTextContent("2026-09");
  });

  it("flags an item that cannot be afforded within the horizon", () => {
    renderDashboard({ queueItems: [waiting("Yacht", 0, 900_000_000)] });
    expect(screen.getByTestId("next-month-Yacht")).toHaveTextContent("not affordable yet");
  });

  it("invites the user to add to the queue when it is empty", () => {
    renderDashboard();
    expect(screen.getByRole("link", { name: "Add to your queue" })).toHaveAttribute(
      "href",
      "/queue",
    );
  });

  it("names the active plan and shows its monthly split", () => {
    renderDashboard();
    const plan = within(screen.getByTestId("active-plan"));
    expect(plan.getByText(/50\/30\/20|Warren|Elizabeth/i)).toBeInTheDocument();
    expect(plan.getByTestId("plan-needs")).toHaveTextContent("₺5,000.00");
  });

  it("draws a 12-month cash-flow chart starting this month", () => {
    renderDashboard();
    const chart = screen.getByTestId("cash-flow-chart");
    expect(chart).toHaveAttribute("data-points", "12");
    const rows = within(chart).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("2026-09");
    expect(rows[12]).toHaveTextContent("2027-08");
  });

  it("shows the chart's installment months from bought purchases", () => {
    const bought: QueueItem = {
      ...waiting("Fridge", 0, 600_000),
      installmentPurchase: {
        offer: { months: 3, payments: [200_000, 200_000, 200_000] },
        firstMonth: "2026-10",
      },
    };
    renderDashboard({ queueItems: [bought] });
    const rows = within(screen.getByTestId("cash-flow-chart")).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("₺5,000.00"); // September: nothing due yet
    expect(rows[2]).toHaveTextContent("₺3,000.00"); // October: 2,000.00 installment
  });

  it("has no chart before a profile exists", () => {
    renderDashboard({ profile: null });
    expect(screen.queryByTestId("cash-flow-chart")).not.toBeInTheDocument();
  });
});
