import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { compareOffers } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { InstallmentCalculator } from "./installment-calculator";

describe("InstallmentCalculator", () => {
  it("renders 4 comparison rows with correct computed values from fixture data", () => {
    renderWithIntl(
      <InstallmentCalculator cashPrice={1200} annualInflation={0.3} onSelect={vi.fn()} />,
    );

    for (const months of [3, 6, 9, 12]) {
      expect(screen.getByTestId(`offer-row-${months}`)).toBeInTheDocument();
    }

    // 12.00 / 3 months = 4.00/month, prefilled as the interest-free placeholder
    expect(screen.getByLabelText("Offer 1 monthly payment")).toHaveValue("4");
    expect(screen.getByTestId("total-paid-3")).toHaveTextContent("₺12.00");
  });

  it("selecting an option calls onSelect with that offer's result", () => {
    const onSelect = vi.fn();
    renderWithIntl(
      <InstallmentCalculator cashPrice={1200} annualInflation={0.3} onSelect={onSelect} />,
    );

    const row = screen.getByTestId("offer-row-6");
    row.querySelector("button")?.click();

    expect(onSelect).toHaveBeenCalledTimes(1);
    const [offer] = onSelect.mock.calls[0] as [{ months: number }];
    expect(offer.months).toBe(6);
  });

  it("lets the user type the real monthly payment from a bank quote and recomputes", () => {
    renderWithIntl(
      <InstallmentCalculator
        cashPrice={1_200_000}
        annualInflation={0.3}
        initialOfferMonths={[12]}
        onSelect={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Offer 1 monthly payment"), {
      target: { value: "1250.50" },
    });

    const expected = compareOffers(
      1_200_000,
      [{ months: 12, payments: Array.from({ length: 12 }, () => 125_050) }],
      0.3,
    )[0];
    expect(screen.getByLabelText("Offer 1 monthly payment")).toHaveValue("1250.50");
    expect(screen.getByTestId("total-paid-12")).toHaveTextContent("₺15,006.00");
    expect(screen.getByTestId("real-saving-12")).toHaveTextContent(
      `${((expected?.realSaving ?? 0) * 100).toFixed(1)}%`,
    );
  });

  it("selecting a typed offer passes its exact payment", () => {
    const onSelect = vi.fn();
    renderWithIntl(
      <InstallmentCalculator
        cashPrice={1_200_000}
        annualInflation={0.3}
        initialOfferMonths={[6]}
        onSelect={onSelect}
      />,
    );
    fireEvent.change(screen.getByLabelText("Offer 1 monthly payment"), {
      target: { value: "2100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ months: 6, monthlyPayment: 210_000 }),
    );
  });

  it("adds and removes offers", () => {
    renderWithIntl(
      <InstallmentCalculator
        cashPrice={1_200_000}
        annualInflation={0.3}
        initialOfferMonths={[3]}
        onSelect={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add offer" }));
    expect(screen.getByLabelText("Offer 2 months")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove offer 2" }));
    expect(screen.queryByLabelText("Offer 2 months")).not.toBeInTheDocument();
  });

  it("does not compute or offer a selection for a row with no months or no payment", () => {
    renderWithIntl(
      <InstallmentCalculator
        cashPrice={1_200_000}
        annualInflation={0.3}
        initialOfferMonths={[6]}
        onSelect={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Offer 1 months"), { target: { value: "0" } });
    expect(screen.queryByRole("button", { name: "Select" })).not.toBeInTheDocument();
    expect(screen.queryByText("NaN")).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("NaN");
  });
});
