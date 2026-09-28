import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DayOfMonthSelect } from "./day-of-month-select";

describe("DayOfMonthSelect", () => {
  it("renders exactly 31 options", () => {
    render(<DayOfMonthSelect aria-label="day" value={1} onChange={vi.fn()} />);
    const select = screen.getByLabelText("day") as HTMLSelectElement;
    expect(select.options).toHaveLength(31);
  });

  it("emits a number, not a string, on selection", () => {
    const onChange = vi.fn();
    render(<DayOfMonthSelect aria-label="day" value={1} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("day"), { target: { value: "15" } });
    expect(onChange).toHaveBeenCalledWith(15);
    expect(typeof onChange.mock.calls[0]?.[0]).toBe("number");
  });
});
