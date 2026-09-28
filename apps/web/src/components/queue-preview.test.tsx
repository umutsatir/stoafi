import { fireEvent, render, screen } from "@testing-library/react";
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

describe("QueuePreview installment flow", () => {
  it("opens the calculator, selecting an offer closes it and shows the installment draft state", () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Calculate with installments" }));
    expect(
      screen.getByRole("heading", { name: "Calculate with installments" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("offer-row-6").querySelector("button") as HTMLElement);

    expect(screen.queryByTestId("offer-row-6")).not.toBeInTheDocument();
    expect(screen.getByTestId("installment-draft-state")).toHaveTextContent("6 months");
  });
});

describe("QueuePreview card timing tip", () => {
  it("shows the tip with the correct extra float days when buying after the statement day", () => {
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
        card={{ id: "c1", label: "Visa", statementDay: 15, dueDay: 5 }}
        purchaseDate="2026-09-20"
        onConfirm={vi.fn()}
      />,
    );

    const tip = screen.getByTestId("card-timing-tip");
    expect(tip).toHaveTextContent("31 extra float days");
    expect(tip).toHaveTextContent("2026-11");
  });

  it("accepting the tip shifts the confirmed commitment's payment month", () => {
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
        card={{ id: "c1", label: "Visa", statementDay: 15, dueDay: 5 }}
        purchaseDate="2026-09-20"
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    const [commitment] = onConfirm.mock.calls[0] as [{ payments: { month: string }[] }];
    expect(commitment.payments[0]?.month).toBe("2026-11");
  });
});

describe("QueuePreview guard breach confirmation", () => {
  it("blocks confirm behind an explicit 'I know' action when there is a breach", () => {
    const onConfirm = vi.fn();
    const expensiveItem = { ...item, price: 10000 };
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
        onConfirm={onConfirm}
      />,
    );

    const confirmButton = screen.getByRole("button", { name: "Confirm" });
    expect(confirmButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "I know" }));
    expect(confirmButton).not.toBeDisabled();

    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    const [, breaches, guardBreachConfirmed] = onConfirm.mock.calls[0] as [
      unknown,
      unknown[],
      boolean,
    ];
    expect(breaches.length).toBeGreaterThan(0);
    expect(guardBreachConfirmed).toBe(true);
  });

  it("does not require confirmation when there is no breach", () => {
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

    expect(screen.getByRole("button", { name: "Confirm" })).not.toBeDisabled();
    expect(screen.queryByTestId("guard-breach-dialog")).not.toBeInTheDocument();
  });
});
