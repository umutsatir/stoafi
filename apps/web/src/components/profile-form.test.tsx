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

  describe("pay day, due day and end month", () => {
    it("saves a pay day only when the user picks one", () => {
      const onSave = vi.fn();
      renderWithIntl(<ProfileForm onSave={onSave} />);
      type("Salary 1 name", "Job");
      type("Salary 1 amount", "1000");
      fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
      expect(onSave.mock.calls[0]?.[0].incomes).toEqual([{ label: "Job", monthly: 100_000 }]);

      fireEvent.change(screen.getByLabelText("Salary 1 pay day"), { target: { value: "15" } });
      fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
      expect(onSave.mock.calls[1]?.[0].incomes).toEqual([
        { label: "Job", monthly: 100_000, payDay: 15 },
      ]);
    });

    it("saves an expense's due day", () => {
      const onSave = vi.fn();
      renderWithIntl(<ProfileForm onSave={onSave} />);
      fireEvent.click(screen.getByRole("button", { name: "Add expense" }));
      type("Expense 1 name", "Rent");
      type("Expense 1 amount", "500");
      fireEvent.change(screen.getByLabelText("Expense 1 due day"), { target: { value: "28" } });
      fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
      expect(onSave.mock.calls[0]?.[0].fixedExpenses).toEqual([
        { label: "Rent", monthly: 50_000, bucket: "needs", dueDay: 28 },
      ]);
    });

    it("shows a month picker only while an expense has an end month, and clears it when turned off", () => {
      const onSave = vi.fn();
      renderWithIntl(<ProfileForm currentMonth="2026-09" onSave={onSave} />);
      fireEvent.click(screen.getByRole("button", { name: "Add expense" }));
      type("Expense 1 name", "Car loan");
      type("Expense 1 amount", "4200");
      expect(screen.queryByLabelText("Expense 1 end month")).not.toBeInTheDocument();

      fireEvent.click(screen.getByLabelText("Expense 1 has an end month"));
      expect(screen.getByLabelText("Expense 1 end month")).toHaveValue("2026-09");
      type("Expense 1 end month", "2027-03");
      fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
      expect(onSave.mock.calls[0]?.[0].fixedExpenses[0]).toMatchObject({ endMonth: "2027-03" });

      fireEvent.click(screen.getByLabelText("Expense 1 has an end month"));
      expect(screen.queryByLabelText("Expense 1 end month")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
      expect(onSave.mock.calls[1]?.[0].fixedExpenses[0]).not.toHaveProperty("endMonth");
    });

    it("ignores an unfinished end month instead of saving a malformed one", () => {
      const onSave = vi.fn();
      renderWithIntl(<ProfileForm onSave={onSave} />);
      fireEvent.click(screen.getByRole("button", { name: "Add expense" }));
      type("Expense 1 name", "Loan");
      type("Expense 1 amount", "100");
      fireEvent.click(screen.getByLabelText("Expense 1 has an end month"));
      fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
      expect(onSave.mock.calls[0]?.[0].fixedExpenses[0]).not.toHaveProperty("endMonth");
    });

    it("shows saved days and end month when editing", () => {
      const initial: Profile = {
        incomes: [{ label: "Job", monthly: 100_000, payDay: 20 }],
        fixedExpenses: [
          { label: "Loan", monthly: 10_000, bucket: "needs", dueDay: 3, endMonth: "2027-01" },
        ],
        livingExpenses: 0,
        savings: 0,
        emergencyFundTargetMonths: 6,
        annualInflationExpectation: 0.3,
      };
      renderWithIntl(<ProfileForm initial={initial} onSave={vi.fn()} />);
      expect(screen.getByLabelText("Salary 1 pay day")).toHaveValue("20");
      expect(screen.getByLabelText("Expense 1 due day")).toHaveValue("3");
      expect(screen.getByLabelText("Expense 1 end month")).toHaveValue("2027-01");
    });
  });

  describe("country inflation suggestion", () => {
    it("fills inflation from the chosen country but leaves it editable", () => {
      const onSave = vi.fn();
      renderWithIntl(<ProfileForm onSave={onSave} />);
      expect(screen.getByLabelText("Annual inflation expectation")).toHaveValue("30");

      fireEvent.change(screen.getByLabelText("Country"), { target: { value: "TR" } });
      expect(screen.getByLabelText("Annual inflation expectation")).toHaveValue("38");
      expect(screen.getByText(/approximate snapshot \(2025-06\)/i)).toBeInTheDocument();

      type("Annual inflation expectation", "45");
      expect(screen.getByLabelText("Annual inflation expectation")).toHaveValue("45");
      fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
      expect(onSave.mock.calls[0]?.[0].annualInflationExpectation).toBeCloseTo(0.45, 10);
    });

    it("leaves inflation alone when no country is chosen", () => {
      renderWithIntl(<ProfileForm onSave={vi.fn()} />);
      fireEvent.change(screen.getByLabelText("Country"), { target: { value: "" } });
      expect(screen.getByLabelText("Annual inflation expectation")).toHaveValue("30");
    });

    it("lists countries by their localized names", () => {
      renderWithIntl(<ProfileForm onSave={vi.fn()} />, "tr");
      expect(screen.getByRole("option", { name: "Türkiye" })).toHaveValue("TR");
    });
  });

  describe("emergency fund completion month", () => {
    const initial: Profile = {
      incomes: [{ label: "Job", monthly: 200_000 }],
      fixedExpenses: [{ label: "Rent", monthly: 100_000, bucket: "needs" }],
      livingExpenses: 0,
      savings: 0,
      emergencyFundTargetMonths: 6,
      annualInflationExpectation: 0.3,
    };

    it("suggests the month the target is reached at the current pace", () => {
      // needs 1,000.00 x 6 = 6,000.00 target, surplus 1,000.00 a month -> 6 months
      renderWithIntl(<ProfileForm initial={initial} currentMonth="2026-09" onSave={vi.fn()} />);
      expect(screen.getByTestId("emergency-fund-caption")).toHaveTextContent("2027-03");
    });

    it("updates as the target months change", () => {
      renderWithIntl(<ProfileForm initial={initial} currentMonth="2026-09" onSave={vi.fn()} />);
      type("Emergency fund target (months)", "3");
      expect(screen.getByTestId("emergency-fund-caption")).toHaveTextContent("2026-12");
    });

    it("says so when the target is already met", () => {
      renderWithIntl(
        <ProfileForm
          initial={{ ...initial, savings: 600_000 }}
          currentMonth="2026-09"
          onSave={vi.fn()}
        />,
      );
      expect(screen.getByTestId("emergency-fund-caption")).toHaveTextContent(
        "already have your emergency fund target",
      );
    });

    it("says so when the surplus can never close the gap", () => {
      renderWithIntl(
        <ProfileForm
          initial={{ ...initial, livingExpenses: 100_000 }}
          currentMonth="2026-09"
          onSave={vi.fn()}
        />,
      );
      expect(screen.getByTestId("emergency-fund-caption")).toHaveTextContent("not enough to reach");
    });

    it("subtracts this month's installments from the surplus", () => {
      renderWithIntl(
        <ProfileForm
          initial={initial}
          currentMonth="2026-09"
          installmentLoad={50_000}
          onSave={vi.fn()}
        />,
      );
      // surplus 500.00 -> 12 months
      expect(screen.getByTestId("emergency-fund-caption")).toHaveTextContent("2027-09");
    });

    it("is hidden without a current month", () => {
      renderWithIntl(<ProfileForm initial={initial} onSave={vi.fn()} />);
      expect(screen.queryByTestId("emergency-fund-caption")).not.toBeInTheDocument();
    });
  });
});
