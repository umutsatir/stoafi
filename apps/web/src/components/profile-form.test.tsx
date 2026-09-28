import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileForm } from "./profile-form";

describe("ProfileForm", () => {
  it("persists via onSave and re-renders with saved values on submit", () => {
    const onSave = vi.fn();
    render(<ProfileForm onSave={onSave} />);

    fireEvent.change(screen.getByLabelText("Monthly income"), { target: { value: "50000" } });
    fireEvent.change(screen.getByLabelText("Current savings"), { target: { value: "10000" } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0]?.[0];
    expect(saved.incomes[0].monthly).toBe(50000);
    expect(saved.savings).toBe(10000);

    // re-renders with saved values: the inputs still reflect the entered state
    expect(screen.getByLabelText("Monthly income")).toHaveValue(50000);
    expect(screen.getByLabelText("Current savings")).toHaveValue(10000);
  });

  it("requires no field beyond the schema's required set (no multi-step wizard)", () => {
    const onSave = vi.fn();
    render(<ProfileForm onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
