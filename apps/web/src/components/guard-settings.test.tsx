import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test-utils";
import { GuardSettings } from "./guard-settings";

describe("GuardSettings", () => {
  it("shows the installment cap as a percent", () => {
    renderWithIntl(<GuardSettings installmentCapPct={0.2} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Installment cap (% of net income)")).toHaveValue("20");
  });

  it("emits a ratio when the user types a percent", () => {
    const onChange = vi.fn();
    renderWithIntl(<GuardSettings installmentCapPct={0.2} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Installment cap (% of net income)"), {
      target: { value: "10" },
    });
    expect(onChange).toHaveBeenCalledWith(expect.closeTo(0.1, 10));
  });

  it("accepts 0 and 100", () => {
    const onChange = vi.fn();
    renderWithIntl(<GuardSettings installmentCapPct={0.2} onChange={onChange} />);
    const field = screen.getByLabelText("Installment cap (% of net income)");
    fireEvent.change(field, { target: { value: "100" } });
    expect(onChange).toHaveBeenLastCalledWith(1);
    fireEvent.change(field, { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it("refuses more than 100 percent and says so, without saving it", () => {
    const onChange = vi.fn();
    renderWithIntl(<GuardSettings installmentCapPct={0.2} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Installment cap (% of net income)"), {
      target: { value: "150" },
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a percent between 0 and 100.")).toBeInTheDocument();
  });

  it("explains what the cap does", () => {
    renderWithIntl(<GuardSettings installmentCapPct={0.2} onChange={vi.fn()} />);
    expect(screen.getByText(/asks you to confirm/i)).toBeInTheDocument();
  });
});
