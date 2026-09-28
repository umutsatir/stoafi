import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Profile, QueueItem } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { QueueTimeline } from "./queue-timeline";

const profile: Profile = {
  incomes: [{ label: "Salary", monthly: 10000, variable: false }],
  fixedExpenses: [],
  avgVariableExpenses: [],
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

const planState = { strategyId: "fifty-thirty-twenty", params: {} };

describe("QueueTimeline", () => {
  it("renders 'not affordable yet' for an item the scheduler can never place", () => {
    const tooExpensive: QueueItem = {
      id: "too-expensive",
      name: "Yacht",
      price: 100_000_000,
      urgency: 2,
      importance: 2,
      isNeed: false,
      expectedUses: 10,
      addedDate: "2025-01-01",
      priceUpdatedDate: "2025-01-01",
      order: 0,
    };

    renderWithIntl(
      <QueueTimeline
        items={[tooExpensive]}
        profile={profile}
        planState={planState}
        today="2026-01-01"
        startMonth="2026-01"
      />,
    );

    expect(screen.getByTestId("not-affordable-too-expensive")).toHaveTextContent(
      "not affordable yet",
    );
  });

  it("renders a cooldown countdown for a want inside its 30-day cooldown, excluded from the schedulable label", () => {
    const cooling: QueueItem = {
      id: "cooling",
      name: "Headphones",
      price: 1000,
      urgency: 2,
      importance: 2,
      isNeed: false,
      expectedUses: 10,
      addedDate: "2026-01-05",
      priceUpdatedDate: "2026-01-05",
      order: 0,
    };

    renderWithIntl(
      <QueueTimeline
        items={[cooling]}
        profile={profile}
        planState={planState}
        today="2026-01-10"
        startMonth="2026-01"
      />,
    );

    expect(screen.getByTestId("cooldown-cooling")).toHaveTextContent("2026-02-04");
    expect(screen.queryByTestId("scheduled-month-cooling")).not.toBeInTheDocument();
  });
});
