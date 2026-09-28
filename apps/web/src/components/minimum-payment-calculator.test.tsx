import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { minimumPaymentPayoff } from "@stoafi/core";
import { MinimumPaymentCalculator } from "./minimum-payment-calculator";

describe("MinimumPaymentCalculator", () => {
  it("renders months/interest matching the direct selector output for the default fixture", () => {
    render(<MinimumPaymentCalculator />);
    const expected = minimumPaymentPayoff(1000, 0.02, { pct: 0.05, floor: 0 });

    expect(screen.getByTestId("months-to-payoff")).toHaveTextContent(String(expected.months));
    expect(screen.getByTestId("total-interest")).toHaveTextContent(
      expected.totalInterest.toFixed(2),
    );
  });

  it("recomputes when the balance input changes", () => {
    render(<MinimumPaymentCalculator />);
    fireEvent.change(screen.getByLabelText("Balance"), { target: { value: "2000" } });

    const expected = minimumPaymentPayoff(2000, 0.02, { pct: 0.05, floor: 0 });
    expect(screen.getByTestId("months-to-payoff")).toHaveTextContent(String(expected.months));
  });
});
