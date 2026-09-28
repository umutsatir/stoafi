import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { QueueItem } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { InstallmentExpenses } from "./installment-expenses";

function bought(
  id: string,
  months: number,
  payment: number,
  firstMonth: `${number}-${number}`,
): QueueItem {
  return {
    id,
    name: id,
    price: months * payment,
    urgency: 2,
    importance: 2,
    isNeed: false,
    expectedUses: 1,
    addedDate: "2026-01-01",
    priceUpdatedDate: "2026-01-01",
    order: 0,
    installmentPurchase: {
      offer: { months, payments: Array.from({ length: months }, () => payment) },
      firstMonth,
    },
  };
}

describe("InstallmentExpenses", () => {
  it("lists each installment purchase with its monthly payment and last month", () => {
    renderWithIntl(
      <InstallmentExpenses
        items={[bought("Fridge", 6, 150_000, "2026-09")]}
        month="2026-09"
        onRemove={vi.fn()}
      />,
    );
    const row = screen.getByTestId("installment-expense-Fridge");
    expect(row).toHaveTextContent("Fridge");
    expect(row).toHaveTextContent("₺1,500.00");
    expect(row).toHaveTextContent("2027-02");
  });

  it("totals this month's installments", () => {
    renderWithIntl(
      <InstallmentExpenses
        items={[bought("A", 3, 100_000, "2026-09"), bought("B", 2, 50_000, "2026-08")]}
        month="2026-09"
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByTestId("installments-this-month")).toHaveTextContent("₺1,500.00");
  });

  it("leaves out purchases that are fully paid and items still waiting in the queue", () => {
    const waiting = bought("Waiting", 1, 1, "2026-09");
    delete waiting.installmentPurchase;
    renderWithIntl(
      <InstallmentExpenses
        items={[bought("Old", 2, 100_000, "2026-01"), waiting]}
        month="2026-09"
        onRemove={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("installment-expense-Old")).not.toBeInTheDocument();
    expect(screen.queryByTestId("installment-expense-Waiting")).not.toBeInTheDocument();
    expect(screen.getByText("No installment purchases yet.")).toBeInTheDocument();
  });

  it("removes a purchase entered by mistake", () => {
    const onRemove = vi.fn();
    renderWithIntl(
      <InstallmentExpenses
        items={[bought("Fridge", 6, 150_000, "2026-09")]}
        month="2026-09"
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove Fridge" }));
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: "Fridge" }));
  });
});
