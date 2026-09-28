import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Profile, QueueItem } from "@stoafi/core";
import { QueuePreview } from "./queue-preview";

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

describe("QueuePreview", () => {
  it("shows before/after effects on the wants bucket and free cash synchronously", () => {
    render(
      <QueuePreview
        item={item}
        profile={profile}
        planState={planState}
        commitments={[]}
        month="2026-09"
        income={10000}
        monthlyNeeds={4000}
        installmentCapPct={0.2}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByTestId("wants-before")).toHaveTextContent("0");
    expect(screen.getByTestId("wants-after")).toHaveTextContent("1000");
    expect(screen.getByTestId("freecash-before")).toHaveTextContent("10000");
    expect(screen.getByTestId("freecash-after")).toHaveTextContent("9000");
  });

  it("shows guard breaches in a visible list when a draft breaches a rule", () => {
    // savings 30000, monthlyNeeds 4000, target 6 months = 24000 floor.
    // an expensive item pushes savingsBalanceAfterDraft below that.
    const expensiveItem: QueueItem = { ...item, price: 10000 };
    render(
      <QueuePreview
        item={expensiveItem}
        profile={profile}
        planState={planState}
        commitments={[]}
        month="2026-09"
        income={10000}
        monthlyNeeds={4000}
        installmentCapPct={0.2}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByTestId("guard-breaches")).toBeInTheDocument();
    expect(screen.getByText("emergency-fund-floor")).toBeInTheDocument();
  });

  it("calls onConfirm with an active commitment when confirmed", () => {
    const onConfirm = vi.fn();
    render(
      <QueuePreview
        item={item}
        profile={profile}
        planState={planState}
        commitments={[]}
        month="2026-09"
        income={10000}
        monthlyNeeds={4000}
        installmentCapPct={0.2}
        onConfirm={onConfirm}
      />,
    );

    screen.getByRole("button", { name: "Confirm" }).click();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    const [commitment] = onConfirm.mock.calls[0] as [{ status: string }];
    expect(commitment.status).toBe("active");
  });
});
