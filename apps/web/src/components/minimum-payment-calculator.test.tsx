import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { minimumPaymentPayoff } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { MinimumPaymentCalculator } from "./minimum-payment-calculator";

function asMoney(minor: number): string {
  return (minor / 100).toLocaleString("en", {
    style: "currency",
    currency: "TRY",
    currencyDisplay: "narrowSymbol",
  });
}

describe("MinimumPaymentCalculator", () => {
  it("renders months/interest matching the direct selector output for the default fixture", () => {
    renderWithIntl(<MinimumPaymentCalculator />);
    const expected = minimumPaymentPayoff(1_000_000, 0.02, { pct: 0.05, floor: 0 });

    expect(screen.getByTestId("months-to-payoff")).toHaveTextContent(String(expected.months));
    expect(screen.getByTestId("total-interest")).toHaveTextContent(asMoney(expected.totalInterest));
  });

  it("takes the balance in major units and recomputes", () => {
    renderWithIntl(<MinimumPaymentCalculator />);
    fireEvent.change(screen.getByLabelText("Balance"), { target: { value: "20000" } });

    const expected = minimumPaymentPayoff(2_000_000, 0.02, { pct: 0.05, floor: 0 });
    expect(screen.getByTestId("months-to-payoff")).toHaveTextContent(String(expected.months));
    expect(screen.getByTestId("total-interest")).toHaveTextContent(asMoney(expected.totalInterest));
  });

  it("takes the monthly rate and minimum percent as percents", () => {
    renderWithIntl(<MinimumPaymentCalculator />);
    fireEvent.change(screen.getByLabelText("Monthly rate"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Minimum payment %"), { target: { value: "10" } });

    const expected = minimumPaymentPayoff(1_000_000, 0.04, { pct: 0.1, floor: 0 });
    expect(screen.getByTestId("months-to-payoff")).toHaveTextContent(String(expected.months));
  });
});
