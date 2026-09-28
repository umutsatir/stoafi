import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Profile, QueueItem } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { useAppStore } from "@/store";
import { QueueList } from "@/components/queue-list";
import { PlanComparison } from "@/components/plan-comparison";
import { InstallmentCalculator } from "@/components/installment-calculator";
import HealthPage from "@/app/health/page";
import QueuePage from "@/app/queue/page";

const profile: Profile = {
  incomes: [{ label: "Salary", monthly: 10000, variable: false }],
  fixedExpenses: [{ label: "Rent", monthly: 4000, bucket: "needs" }],
  avgVariableExpenses: [],
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
      commitments: [],
      decisions: [],
    });
  });

  it("queue -> cost-in-life-energy and eisenhower-matrix", () => {
    renderWithIntl(
      <QueueList
        items={[item]}
        profile={profile}
        planState={planState}
        today="2026-01-01"
        startMonth="2026-01"
        hourlyNetIncome={200}
      />,
    );
    expect(screen.getByTestId("lesson-link-cost-in-life-energy")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-link-eisenhower-matrix")).toBeInTheDocument();
  });

  it("guards/health -> room-for-error", () => {
    useAppStore.setState({ profile, commitments: [] });
    renderWithIntl(<HealthPage />);
    expect(screen.getByTestId("lesson-link-room-for-error")).toBeInTheDocument();
  });

  it("plan investing bucket -> index-funds", () => {
    renderWithIntl(<PlanComparison profile={profile} />);
    expect(screen.getByTestId("lesson-link-index-funds")).toBeInTheDocument();
  });

  it("sinking-funds -> sinking-funds card (linked from queue, its closest existing screen)", () => {
    useAppStore.setState({ profile, planState, queueItems: [], commitments: [], decisions: [] });
    renderWithIntl(<QueuePage />);
    expect(screen.getByTestId("lesson-link-sinking-funds")).toBeInTheDocument();
  });

  it("installments -> time-value-of-money", () => {
    renderWithIntl(
      <InstallmentCalculator cashPrice={1200} annualInflation={0.3} onSelect={vi.fn()} />,
    );
    expect(screen.getByTestId("lesson-link-time-value-of-money")).toBeInTheDocument();
  });
});
