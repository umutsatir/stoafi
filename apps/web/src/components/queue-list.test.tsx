import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Profile, QueueItem } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { QueueList } from "./queue-list";

const profile: Profile = {
  incomes: [{ label: "Salary", monthly: 10000, variable: false }],
  fixedExpenses: [],
  avgVariableExpenses: [],
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

const planState = { strategyId: "fifty-thirty-twenty", params: {} };

function item(id: string, order: number): QueueItem {
  return {
    id,
    name: id,
    price: 2000,
    urgency: 2,
    importance: 2,
    isNeed: false,
    expectedUses: 10,
    addedDate: "2025-01-01",
    priceUpdatedDate: "2025-01-01",
    order,
  };
}

describe("QueueList", () => {
  it("reordering via the move buttons re-runs the scheduler and updates displayed months", () => {
    const items = [item("first", 0), item("second", 1)];
    renderWithIntl(
      <QueueList
        items={items}
        profile={profile}
        planState={planState}
        today="2026-01-01"
        startMonth="2026-01"
        hourlyNetIncome={200}
      />,
    );

    const firstMonthBefore = screen.getByTestId("month-first").textContent;
    const secondMonthBefore = screen.getByTestId("month-second").textContent;

    fireEvent.click(screen.getByLabelText("Move first down"));

    const firstMonthAfter = screen.getByTestId("month-first").textContent;
    const secondMonthAfter = screen.getByTestId("month-second").textContent;

    expect([firstMonthAfter, secondMonthAfter]).not.toEqual([firstMonthBefore, secondMonthBefore]);
  });
});
