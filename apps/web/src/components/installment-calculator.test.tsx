import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

    // 12.00 / 3 months = 4.00/month
    expect(screen.getByTestId("monthly-payment-3")).toHaveTextContent("₺4.00");
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
});
