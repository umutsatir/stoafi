import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Card, Profile, QueueItem, SinkingFund } from "@stoafi/core";
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

function waiting(id: string, order: number, price = 10_000, isNeed = false): QueueItem {
  return {
    id,
    name: id,
    price,
    urgency: 2,
    importance: 2,
    isNeed,
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

  it("does not schedule a need while recurring costs already fill the needs budget", () => {
    // 50/30/20 on 10,000.00 gives needs 5,000.00; rent 2,000.00 + living 3,000.00 use all of it.
    renderDashboard({ queueItems: [waiting("Boiler", 0, 10_000, true)] });
    expect(screen.getByTestId("next-month-Boiler")).toHaveTextContent("not affordable yet");
  });

  it("schedules a need once recurring costs leave room for it", () => {
    renderDashboard({
      profile: { ...profile, livingExpenses: 100_000 },
      queueItems: [waiting("Boiler", 0, 10_000, true)],
    });
    expect(screen.getByTestId("next-month-Boiler")).toHaveTextContent("2026-09");
  });

  it("takes sinking-fund set-asides off what is left in the months they run", () => {
    // 6,000.00 due 2027-03 = 1,000.00 a month from next month (2026-10)
    const fund: SinkingFund = {
      id: "ins",
      label: "Insurance",
      target: 600_000,
      dueMonth: "2027-03",
      currentBalance: 0,
    };
    renderDashboard({ sinkingFunds: [fund] });
    const rows = within(screen.getByTestId("cash-flow-chart")).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("₺5,000.00"); // September: nothing set aside yet
    expect(rows[2]).toHaveTextContent("₺4,000.00"); // October: 1,000.00 set aside
  });

  describe("what is coming up", () => {
    const withDays: Profile = {
      ...profile,
      incomes: [{ label: "Job", monthly: 800_000, payDay: 17 }],
      fixedExpenses: [
        { label: "Rent", monthly: 200_000, bucket: "needs", dueDay: 20 },
        { label: "Far bill", monthly: 5_000, bucket: "needs", dueDay: 3 },
      ],
    };
    const bonus: Card = { id: "c", label: "Bonus", statementDay: 1, dueDay: 16 };

    it("lists pay days, bills and card due dates in the next two weeks, soonest first", () => {
      renderDashboard({ profile: withDays, cards: [bonus] });
      const list = within(screen.getByTestId("upcoming"));
      const items = list.getAllByRole("listitem").map((li) => li.textContent ?? "");
      expect(items).toHaveLength(3);
      expect(items[0]).toContain("Bonus");
      expect(items[1]).toContain("Job");
      expect(items[1]).toContain("+₺8,000.00");
      expect(items[2]).toContain("Rent");
      expect(list.queryByText("Far bill")).not.toBeInTheDocument();
    });

    it("says tomorrow and today instead of a date", () => {
      renderDashboard({ profile: withDays, cards: [bonus], today: "2026-09-16" });
      expect(within(screen.getByTestId("event-card-c")).getByText("Today")).toBeInTheDocument();
      expect(
        within(screen.getByTestId("event-income-0")).getByText("Tomorrow"),
      ).toBeInTheDocument();
    });

    it("says so when nothing is due", () => {
      renderDashboard({ profile: { ...profile, fixedExpenses: [], incomes: [] } });
      expect(screen.getByText("Nothing due in the next two weeks.")).toBeInTheDocument();
    });
  });

  it("shows what is still to set aside this month and links to the savings page", () => {
    renderDashboard();
    expect(screen.getByTestId("saving-sentence")).toHaveTextContent(/Set aside .* more/);
    expect(
      within(screen.getByTestId("saving-widget")).getByRole("link", { name: "Open savings" }),
    ).toHaveAttribute("href", "/sinking-funds");
  });

  it("gives the overall health in a word, with the reason", () => {
    renderDashboard();
    expect(screen.getByTestId("home-health")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See the details" })).toHaveAttribute(
      "href",
      "/health",
    );
  });

  it("offers a fix right in each warning", () => {
    renderDashboard({ profile: { ...profile, savings: 0 } });
    expect(screen.getByRole("link", { name: "Add to the fund" })).toHaveAttribute(
      "href",
      "/sinking-funds",
    );
  });
});
