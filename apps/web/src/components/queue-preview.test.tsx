import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Profile, QueueItem } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { QueuePreview } from "./queue-preview";

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

describe("QueuePreview", () => {
  it("shows before/after effects on the wants bucket and free cash synchronously", () => {
    renderWithIntl(
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

    expect(screen.getByTestId("wants-before")).toHaveTextContent("₺0.00");
    expect(screen.getByTestId("wants-after")).toHaveTextContent("₺10.00");
    expect(screen.getByTestId("freecash-before")).toHaveTextContent("₺100.00");
    expect(screen.getByTestId("freecash-after")).toHaveTextContent("₺90.00");
  });

  it("shows guard breaches in a visible list when a draft breaches a rule", () => {
    // savings 30000, monthlyNeeds 4000, target 6 months = 24000 floor.
    // an expensive item pushes savingsBalanceAfterDraft below that.
    const expensiveItem: QueueItem = { ...item, price: 10000 };
    renderWithIntl(
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
    renderWithIntl(
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
    renderWithIntl(
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
    renderWithIntl(
      <QueuePreview
        item={item}
        profile={profile}
        planState={planState}
        commitments={[]}
        month="2026-09"
        income={10000}
        monthlyNeeds={4000}
        installmentCapPct={0.2}
        cards={[{ id: "c1", label: "Visa", statementDay: 15, dueDay: 5 }]}
        purchaseDate="2026-09-20"
        onConfirm={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Pay with card"), { target: { value: "c1" } });
    const tip = screen.getByTestId("card-timing-tip");
    expect(tip).toHaveTextContent("31 extra float days");
    expect(tip).toHaveTextContent("2026-11");
  });

  it("accepting the tip shifts the confirmed commitment's payment month", () => {
    const onConfirm = vi.fn();
    renderWithIntl(
      <QueuePreview
        item={item}
        profile={profile}
        planState={planState}
        commitments={[]}
        month="2026-09"
        income={10000}
        monthlyNeeds={4000}
        installmentCapPct={0.2}
        cards={[{ id: "c1", label: "Visa", statementDay: 15, dueDay: 5 }]}
        purchaseDate="2026-09-20"
        onConfirm={onConfirm}
      />,
    );

    fireEvent.change(screen.getByLabelText("Pay with card"), { target: { value: "c1" } });
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
    renderWithIntl(
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
    renderWithIntl(
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

describe("QueuePreview purchase method", () => {
  function renderPreview(overrides: Partial<Parameters<typeof QueuePreview>[0]> = {}) {
    const onConfirm = vi.fn();
    renderWithIntl(
      <QueuePreview
        item={{ ...item, price: 12_000 }}
        profile={profile}
        planState={planState}
        commitments={[]}
        month="2026-09"
        income={10000}
        monthlyNeeds={4000}
        installmentCapPct={0.2}
        onConfirm={onConfirm}
        {...overrides}
      />,
    );
    return onConfirm;
  }

  function pickOffer(months: number, monthlyPayment: string) {
    fireEvent.click(screen.getByRole("button", { name: "Calculate with installments" }));
    const row = screen.getByTestId(`offer-row-${months}`);
    const input = row.querySelector('input[inputmode="decimal"]') as HTMLElement;
    fireEvent.change(input, { target: { value: monthlyPayment } });
    fireEvent.click(row.querySelector("button") as HTMLElement);
  }

  it("confirms a cash purchase with the cash method", () => {
    const onConfirm = renderPreview({ item: { ...item, price: 1000 } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    const args = onConfirm.mock.calls[0] as unknown[];
    expect(args[3]).toEqual({ method: "cash" });
  });

  it("previews the installment payment as load in the first month and does not spend savings", () => {
    renderPreview();
    // cash: 120.00 taken from 300.00 savings drops below the 6-month floor -> breach
    expect(screen.getByTestId("guard-breaches")).toHaveTextContent("emergency-fund-floor");

    pickOffer(6, "20");
    expect(screen.getByTestId("installment-load-before")).toHaveTextContent("₺0.00");
    expect(screen.getByTestId("installment-load-after")).toHaveTextContent("₺20.00");
    // installments leave savings untouched, so the emergency-fund breach is gone
    expect(screen.queryByText("emergency-fund-floor")).not.toBeInTheDocument();
  });

  it("confirms an installment purchase with the chosen offer and first payment month", () => {
    const onConfirm = renderPreview();
    pickOffer(6, "20");
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    const [commitment, , , purchase] = onConfirm.mock.calls[0] as [
      { source: { module: string }; status: string; payments: { month: string; amount: number }[] },
      unknown,
      unknown,
      unknown,
    ];
    expect(purchase).toEqual({
      method: "installment",
      offer: { months: 6, payments: [2000, 2000, 2000, 2000, 2000, 2000] },
      firstMonth: "2026-09",
    });
    expect(commitment.source.module).toBe("installments");
    expect(commitment.status).toBe("active");
    expect(commitment.payments.map((p) => p.month)).toEqual([
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
      "2027-01",
      "2027-02",
    ]);
  });

  it("can go back to paying cash after choosing an offer", () => {
    const onConfirm = renderPreview({ item: { ...item, price: 1000 } });
    pickOffer(3, "5");
    expect(screen.getByTestId("installment-draft-state")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pay cash instead" }));
    expect(screen.queryByTestId("installment-draft-state")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect((onConfirm.mock.calls[0] as unknown[])[3]).toEqual({ method: "cash" });
  });

  it("starts installments in the shifted month when the card timing tip is accepted", () => {
    const onConfirm = renderPreview({
      item: { ...item, price: 1000 },
      cards: [{ id: "c1", label: "Visa", statementDay: 15, dueDay: 5 }],
      purchaseDate: "2026-09-20",
    });
    fireEvent.change(screen.getByLabelText("Pay with card"), { target: { value: "c1" } });
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    pickOffer(3, "5");
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    const purchase = (onConfirm.mock.calls[0] as unknown[])[3] as { firstMonth: string };
    expect(purchase.firstMonth).toBe("2026-11");
  });
});

describe("QueuePreview skip, postpone, first fitting month and card choice", () => {
  function renderIt(overrides: Partial<Parameters<typeof QueuePreview>[0]> = {}) {
    const onConfirm = vi.fn();
    const onDecide = vi.fn();
    renderWithIntl(
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
        onDecide={onDecide}
        {...overrides}
      />,
    );
    return { onConfirm, onDecide };
  }

  it("records a skip and a postpone", () => {
    const { onDecide } = renderIt();
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    fireEvent.click(screen.getByRole("button", { name: "Postpone" }));
    expect(onDecide.mock.calls).toEqual([["skipped"], ["postponed"]]);
  });

  it("does not need a guard acknowledgement to skip or postpone", () => {
    const { onDecide } = renderIt({ item: { ...item, price: 10000 } });
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onDecide).toHaveBeenCalledWith("skipped");
  });

  it("shows the first month that fits and previews that month on request", () => {
    const { onConfirm } = renderIt({ suggestedMonth: "2026-11" });
    expect(screen.getByTestId("suggested-month")).toHaveTextContent("2026-11");

    fireEvent.click(screen.getByRole("button", { name: "Preview in 2026-11" }));
    fireEvent.click(screen.getByRole("button", { name: "Calculate with installments" }));
    fireEvent.click(screen.getByTestId("offer-row-3").querySelector("button") as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    const purchase = (onConfirm.mock.calls[0] as unknown[])[3] as { firstMonth: string };
    expect(purchase.firstMonth).toBe("2026-11");
  });

  it("says when nothing fits yet and offers no month to preview", () => {
    renderIt({ suggestedMonth: null });
    expect(screen.getByTestId("suggested-month")).toHaveTextContent("not affordable yet");
    expect(screen.queryByRole("button", { name: /Preview in/ })).not.toBeInTheDocument();
  });

  it("offers no suggestion line when the caller has none", () => {
    renderIt();
    expect(screen.queryByTestId("suggested-month")).not.toBeInTheDocument();
  });

  it("offers a card choice only when there are cards, and the tip follows the choice", () => {
    renderIt();
    expect(screen.queryByLabelText("Pay with card")).not.toBeInTheDocument();
  });

  it("shows the timing tip only for the chosen card and clears it for no card", () => {
    renderIt({
      cards: [{ id: "c1", label: "Visa", statementDay: 15, dueDay: 5 }],
      purchaseDate: "2026-09-20",
    });
    expect(screen.queryByTestId("card-timing-tip")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Pay with card"), { target: { value: "c1" } });
    expect(screen.getByTestId("card-timing-tip")).toHaveTextContent("31 extra float days");
    fireEvent.change(screen.getByLabelText("Pay with card"), { target: { value: "" } });
    expect(screen.queryByTestId("card-timing-tip")).not.toBeInTheDocument();
  });

  it("drops an accepted shift when the card is changed back to none", () => {
    const { onConfirm } = renderIt({
      cards: [{ id: "c1", label: "Visa", statementDay: 15, dueDay: 5 }],
      purchaseDate: "2026-09-20",
    });
    fireEvent.change(screen.getByLabelText("Pay with card"), { target: { value: "c1" } });
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    fireEvent.change(screen.getByLabelText("Pay with card"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Calculate with installments" }));
    fireEvent.click(screen.getByTestId("offer-row-3").querySelector("button") as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    const purchase = (onConfirm.mock.calls[0] as unknown[])[3] as { firstMonth: string };
    expect(purchase.firstMonth).toBe("2026-09");
  });
});
