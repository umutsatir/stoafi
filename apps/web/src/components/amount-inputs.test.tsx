import { fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test-utils";
import { MoneyInput } from "./money-input";
import { PercentInput } from "./percent-input";

function MoneyHarness({
  onChange,
  initial = 0,
}: {
  onChange: (m: number) => void;
  initial?: number;
}) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor="amount">Amount</label>
      <MoneyInput
        id="amount"
        value={value}
        currency="TRY"
        onChange={(m) => {
          setValue(m);
          onChange(m);
        }}
      />
    </>
  );
}

describe("MoneyInput", () => {
  it("emits integer minor units when the user types major units", () => {
    const onChange = vi.fn();
    renderWithIntl(<MoneyHarness onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "300" } });
    expect(onChange).toHaveBeenLastCalledWith(30_000);
  });

  it("emits one kuruş for 0,01 in the Turkish locale", () => {
    const onChange = vi.fn();
    renderWithIntl(<MoneyHarness onChange={onChange} />, "tr");
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "0,01" } });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("emits 0 when cleared", () => {
    const onChange = vi.fn();
    renderWithIntl(<MoneyHarness onChange={onChange} initial={5_000} />);
    const input = screen.getByLabelText("Amount");
    expect(input).toHaveValue("50");
    fireEvent.change(input, { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it("does not emit for a negative or non-numeric entry and flags it invalid", () => {
    const onChange = vi.fn();
    renderWithIntl(<MoneyHarness onChange={onChange} initial={1_000} />);
    const input = screen.getByLabelText("Amount");
    fireEvent.change(input, { target: { value: "-5" } });
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(input, { target: { value: "5" } });
    expect(onChange).toHaveBeenLastCalledWith(500);
    expect(input).not.toHaveAttribute("aria-invalid", "true");
  });

  it("shows the currency symbol and uses a decimal keyboard", () => {
    renderWithIntl(<MoneyHarness onChange={vi.fn()} />);
    expect(screen.getByText("₺")).toBeInTheDocument();
    expect(screen.getByLabelText("Amount")).toHaveAttribute("inputmode", "decimal");
  });
});

describe("PercentInput", () => {
  function PercentHarness({ onChange }: { onChange: (r: number) => void }) {
    const [value, setValue] = useState(0.3);
    return (
      <>
        <label htmlFor="pct">Rate</label>
        <PercentInput
          id="pct"
          value={value}
          onChange={(r) => {
            setValue(r);
            onChange(r);
          }}
        />
      </>
    );
  }

  it("displays a ratio as a percent number", () => {
    renderWithIntl(<PercentHarness onChange={vi.fn()} />);
    expect(screen.getByLabelText("Rate")).toHaveValue("30");
  });

  it("emits a ratio when the user types a percent", () => {
    const onChange = vi.fn();
    renderWithIntl(<PercentHarness onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Rate"), { target: { value: "45" } });
    expect(onChange).toHaveBeenLastCalledWith(expect.closeTo(0.45, 10));
  });
});
