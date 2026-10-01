import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Profile, QueueItem } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { useAppStore } from "@/store";
import { QueueList } from "@/components/queue-list";
import { PlanComparison } from "@/components/plan-comparison";
import { InstallmentCalculator } from "@/components/installment-calculator";
import HealthPage from "@/app/health/page";
import SinkingFundsPage from "@/app/sinking-funds/page";

const profile: Profile = {
  incomes: [{ label: "Salary", monthly: 10000 }],
  fixedExpenses: [{ label: "Rent", monthly: 4000, bucket: "needs" }],
  livingExpenses: 0,
  savings: 30000,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

const planState = { strategyId: "fifty-thirty-twenty", params: {} };

const item: QueueItem = {
  id: "item-1",
  name: "Headphones",
  price: 1000,
  urgency: 2,
  importance: 2,
  isNeed: false,
  expectedUses: 50,
  addedDate: "2025-01-01",
  priceUpdatedDate: "2025-01-01",
  order: 0,
};

describe("remaining lesson cards are linked from their SPEC-listed screens", () => {
  beforeEach(() => {
    useAppStore.setState({
      profile: null,
      planState: null,
      queueItems: [],
      decisions: [],
    });
  });

  it("queue -> cost-in-life-energy and eisenhower-matrix", () => {
    renderWithIntl(
      <QueueList
        items={[item]}
        onItemsChange={() => undefined}
        profile={profile}
        planState={planState}
        today="2026-01-01"
        startMonth="2026-01"
        hourlyNetIncome={200}
      />,
    );
    expect(screen.getByTestId("lesson-link-cost-in-life-energy")).toHaveAttribute(
      "href",
      "/lessons#cost-in-life-energy",
    );
    expect(screen.getByTestId("lesson-link-eisenhower-matrix")).toHaveAttribute(
      "href",
      "/lessons#eisenhower-matrix",
    );
  });

  it("guards/health -> room-for-error", () => {
    useAppStore.setState({ profile });
    renderWithIntl(<HealthPage />);
    expect(screen.getByTestId("lesson-link-room-for-error")).toHaveAttribute(
      "href",
      "/lessons#room-for-error",
    );
  });

  it("plan investing bucket -> index-funds, read in a panel without leaving the page", async () => {
    renderWithIntl(<PlanComparison profile={profile} />);
    fireEvent.click(screen.getByTestId("lesson-link-index-funds"));
    const panel = await screen.findByRole("dialog", { name: "Index funds and costs" });
    expect(within(panel).getByText(/Bogle/)).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "Open in the lessons page" })).toHaveAttribute(
      "href",
      "/lessons#index-funds",
    );
  });

  it("sinking-funds -> sinking-funds card (linked from the sinking funds screen)", () => {
    renderWithIntl(<SinkingFundsPage />);
    expect(screen.getByTestId("lesson-link-sinking-funds")).toHaveAttribute(
      "href",
      "/lessons#sinking-funds",
    );
  });

  it("installments -> time-value-of-money", () => {
    renderWithIntl(
      <InstallmentCalculator cashPrice={1200} annualInflation={0.3} onSelect={vi.fn()} />,
    );
    expect(screen.getByTestId("lesson-link-time-value-of-money")).toHaveAttribute(
      "href",
      "/lessons#time-value-of-money",
    );
  });
});
