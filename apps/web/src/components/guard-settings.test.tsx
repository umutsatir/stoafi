import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test-utils";
import { GuardSettings } from "./guard-settings";

describe("GuardSettings", () => {
  it("shows the installment cap as a percent", () => {
    renderWithIntl(<GuardSettings installmentCapPct={0.2} onChange={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("%20");
  });

  it("emits a ratio one percent at a time", () => {
    const onChange = vi.fn();
    renderWithIntl(<GuardSettings installmentCapPct={0.2} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Decrease" }));
    expect(onChange).toHaveBeenLastCalledWith(expect.closeTo(0.19, 10));
    fireEvent.click(screen.getByRole("button", { name: "Increase" }));
    expect(onChange).toHaveBeenLastCalledWith(expect.closeTo(0.21, 10));
  });

  it("stops at 0 and at 100", () => {
    renderWithIntl(<GuardSettings installmentCapPct={1} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Increase" })).toBeDisabled();
  });

  it("explains what the cap does", () => {
    renderWithIntl(<GuardSettings installmentCapPct={0.2} onChange={vi.fn()} />);
    expect(screen.getByText(/asks you to confirm/i)).toBeInTheDocument();
  });
});
