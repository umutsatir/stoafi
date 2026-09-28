import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Profile } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { ProfileForm } from "./profile-form";

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("ProfileForm", () => {
  it("saves two salaries and a loan as integer minor units", () => {
    const onSave = vi.fn();
    renderWithIntl(<ProfileForm onSave={onSave} />);

    type("Salary 1 name", "Main job");
    type("Salary 1 amount", "30000");
    fireEvent.click(screen.getByRole("button", { name: "Add salary" }));
    type("Salary 2 name", "Partner");
    type("Salary 2 amount", "12500.50");

    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));
    type("Expense 1 name", "Car loan");
    type("Expense 1 amount", "4200");

    type("Monthly living costs", "9000");
    type("Current savings", "10000");
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      incomes: [
        { label: "Main job", monthly: 3_000_000 },
        { label: "Partner", monthly: 1_250_050 },
      ],
      fixedExpenses: [{ label: "Car loan", monthly: 420_000, bucket: "needs" }],
      livingExpenses: 900_000,
      savings: 1_000_000,
      emergencyFundTargetMonths: 6,
      annualInflationExpectation: 0.3,
    } satisfies Profile);
  });

  it("lets an expense be marked as a want", () => {
    const onSave = vi.fn();
    renderWithIntl(<ProfileForm onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));
    type("Expense 1 name", "Streaming");
    type("Expense 1 amount", "100");
    fireEvent.change(screen.getByLabelText("Expense 1 type"), { target: { value: "wants" } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(onSave.mock.calls[0]?.[0].fixedExpenses).toEqual([
      { label: "Streaming", monthly: 10_000, bucket: "wants" },
    ]);
  });

  it("removes a row", () => {
    const onSave = vi.fn();
    renderWithIntl(<ProfileForm onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Add salary" }));
    type("Salary 1 name", "A");
    type("Salary 1 amount", "1");
    type("Salary 2 name", "B");
    type("Salary 2 amount", "2");
    fireEvent.click(screen.getByRole("button", { name: "Remove salary 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(onSave.mock.calls[0]?.[0].incomes).toEqual([{ label: "B", monthly: 200 }]);
  });

  it("shows inflation as a percent and saves it as a ratio", () => {
    const onSave = vi.fn();
    renderWithIntl(<ProfileForm onSave={onSave} />);
    expect(screen.getByLabelText("Annual inflation expectation")).toHaveValue("30");
    type("Annual inflation expectation", "45");
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(onSave.mock.calls[0]?.[0].annualInflationExpectation).toBeCloseTo(0.45, 10);
  });

  it("shows saved values when editing an existing profile", () => {
    const initial: Profile = {
      incomes: [{ label: "Job", monthly: 5_000_000 }],
      fixedExpenses: [{ label: "Rent", monthly: 1_500_000, bucket: "needs" }],
      livingExpenses: 800_000,
      savings: 250_050,
      emergencyFundTargetMonths: 3,
      annualInflationExpectation: 0.5,
    };
    renderWithIntl(<ProfileForm initial={initial} onSave={vi.fn()} />);
    expect(screen.getByLabelText("Salary 1 name")).toHaveValue("Job");
    expect(screen.getByLabelText("Salary 1 amount")).toHaveValue("50000");
    expect(screen.getByLabelText("Expense 1 name")).toHaveValue("Rent");
    expect(screen.getByLabelText("Monthly living costs")).toHaveValue("8000");
    expect(screen.getByLabelText("Current savings")).toHaveValue("2500.5");
    expect(screen.getByLabelText("Emergency fund target (months)")).toHaveValue(3);
    expect(screen.getByLabelText("Annual inflation expectation")).toHaveValue("50");
  });

  it("requires no field beyond the schema's required set (no multi-step wizard)", () => {
    const onSave = vi.fn();
    renderWithIntl(<ProfileForm onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0]?.[0].incomes).toEqual([]);
  });

  it("uses the Turkish decimal comma when typing amounts", () => {
    const onSave = vi.fn();
    renderWithIntl(<ProfileForm onSave={onSave} />, "tr");
    type("Maaş 1 tutarı", "1.250,50");
    type("Maaş 1 adı", "İş");
    fireEvent.click(screen.getByRole("button", { name: "Profili kaydet" }));
    expect(onSave.mock.calls[0]?.[0].incomes).toEqual([{ label: "İş", monthly: 125_050 }]);
  });
});
