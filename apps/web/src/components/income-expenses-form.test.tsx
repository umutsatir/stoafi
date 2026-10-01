import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Profile } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { IncomeExpensesForm } from "./income-expenses-form";

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

/** Opens the add panel and picks a type; fields are then filled by the caller. */
function openAdd(kind?: string) {
  fireEvent.click(screen.getByRole("button", { name: "Add expense" }));
  if (kind) fireEvent.click(screen.getByRole("radio", { name: new RegExp(`^${kind}`) }));
}
function submitPanel(name = "Add") {
  const dialog = screen.getByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name }));
}

const base: Profile = {
  incomes: [{ label: "Job", monthly: 5_000_000 }],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

describe("IncomeExpensesForm", () => {
  it("saves two salaries and living costs as integer minor units", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm onSave={onSave} />);

    type("Salary 1 name", "Main job");
    type("Salary 1 amount", "30000");
    fireEvent.click(screen.getByRole("button", { name: "Add salary" }));
    type("Salary 2 name", "Partner");
    type("Salary 2 amount", "12500.50");
    type("Monthly living costs", "9000");
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      incomes: [
        { label: "Main job", monthly: 3_000_000 },
        { label: "Partner", monthly: 1_250_050 },
      ],
      fixedExpenses: [],
      livingExpenses: 900_000,
    });
  });

  it("removes a salary row", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Add salary" }));
    type("Salary 1 name", "A");
    type("Salary 1 amount", "1");
    type("Salary 2 name", "B");
    type("Salary 2 amount", "2");
    fireEvent.click(screen.getByRole("button", { name: "Remove salary 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(onSave.mock.calls[0]?.[0].incomes).toEqual([{ label: "B", monthly: 200 }]);
  });

  it("requires no field beyond the schema's required set (no multi-step wizard)", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0]?.[0].incomes).toEqual([]);
  });

  it("uses the Turkish decimal comma when typing amounts", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm onSave={onSave} />, "tr");
    type("Maaş 1 tutarı", "1.250,50");
    type("Maaş 1 adı", "İş");
    fireEvent.click(screen.getByRole("button", { name: "Profili kaydet" }));
    expect(onSave.mock.calls[0]?.[0].incomes).toEqual([{ label: "İş", monthly: 125_050 }]);
  });

  it("saves a pay day only when the user picks one", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm onSave={onSave} />);
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
});

describe("adding an expense", () => {
  it("saves a regular bill at once, as a need by default", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm initial={base} currentMonth="2026-09" onSave={onSave} />);
    openAdd();
    type("Name", "Rent");
    type("Monthly amount", "15000");
    submitPanel();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0]?.[0].fixedExpenses).toEqual([
      { label: "Rent", monthly: 1_500_000, bucket: "needs" },
    ]);
    expect(screen.getByTestId("expense-group-regular")).toHaveTextContent("Rent");
  });

  it("lets a bill be marked as a want and given a due day", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm initial={base} currentMonth="2026-09" onSave={onSave} />);
    openAdd();
    type("Name", "Streaming");
    type("Monthly amount", "100");
    fireEvent.click(screen.getByRole("radio", { name: "Want" }));
    fireEvent.change(screen.getByLabelText("Due on day"), { target: { value: "28" } });
    submitPanel();
    expect(onSave.mock.calls[0]?.[0].fixedExpenses).toEqual([
      { label: "Streaming", monthly: 10_000, bucket: "wants", dueDay: 28 },
    ]);
  });

  it("saves an installment with the payments left as an end month, and files it under installments", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm initial={base} currentMonth="2026-09" onSave={onSave} />);
    openAdd("Installment");
    type("Name", "Phone");
    type("Monthly payment", "1500");
    type("Payments left", "6");
    expect(screen.getByText(/The last payment is in February 2027/)).toBeInTheDocument();
    submitPanel();
    expect(onSave.mock.calls[0]?.[0].fixedExpenses).toEqual([
      {
        label: "Phone",
        monthly: 150_000,
        bucket: "needs",
        kind: "installment",
        endMonth: "2027-02",
      },
    ]);
    expect(screen.getByTestId("expense-group-installment")).toHaveTextContent("Phone");
    expect(screen.getByTestId("expense-group-installment")).toHaveTextContent("6 payments left");
    expect(screen.queryByTestId("expense-group-regular")).not.toBeInTheDocument();
  });

  it("saves a loan as a loan, apart from installments", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm initial={base} currentMonth="2026-09" onSave={onSave} />);
    openAdd("Loan");
    type("Name", "Car loan");
    type("Monthly payment", "4200");
    type("Payments left", "24");
    submitPanel();
    expect(onSave.mock.calls[0]?.[0].fixedExpenses[0]).toMatchObject({
      kind: "loan",
      endMonth: "2028-08",
    });
    expect(screen.getByTestId("expense-group-loan")).toHaveTextContent("Car loan");
  });

  it("lets a recurring line be a saving or an investing transfer", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm initial={base} currentMonth="2026-09" onSave={onSave} />);
    openAdd("Saving or investing");
    type("Name", "Gold every month");
    type("Monthly amount", "2000");
    fireEvent.click(screen.getByRole("radio", { name: "Investing" }));
    submitPanel();
    expect(onSave.mock.calls[0]?.[0].fixedExpenses[0]).toMatchObject({
      bucket: "investing",
      monthly: 200_000,
    });
    expect(screen.getByTestId("expense-group-saving")).toHaveTextContent("Gold every month");
  });

  it("only shows the payments-left field for installments and loans", () => {
    renderWithIntl(<IncomeExpensesForm initial={base} currentMonth="2026-09" onSave={vi.fn()} />);
    openAdd();
    expect(screen.queryByLabelText("Payments left")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /^Installment/ }));
    expect(screen.getByLabelText("Payments left")).toBeInTheDocument();
  });

  it("shows an end month picker for a bill only while it stops at some point", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm initial={base} currentMonth="2026-09" onSave={onSave} />);
    openAdd();
    type("Name", "Gym");
    type("Monthly amount", "300");
    expect(screen.queryByLabelText("End month")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("It stops at some point"));
    type("End month", "2027-03");
    submitPanel();
    expect(onSave.mock.calls[0]?.[0].fixedExpenses[0]).toMatchObject({ endMonth: "2027-03" });
  });

  it("explains what is missing instead of saving an empty line", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm initial={base} currentMonth="2026-09" onSave={onSave} />);
    openAdd();
    submitPanel();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Write a name.")).toBeInTheDocument();
    expect(screen.getByText("The amount must be more than zero.")).toBeInTheDocument();
  });

  it("does not accept zero payments left for an installment", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm initial={base} currentMonth="2026-09" onSave={onSave} />);
    openAdd("Installment");
    type("Name", "TV");
    type("Monthly payment", "100");
    type("Payments left", "0");
    submitPanel();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("At least 1 payment must be left.")).toBeInTheDocument();
  });
});

describe("existing expenses", () => {
  const withExpenses: Profile = {
    ...base,
    fixedExpenses: [
      { label: "Rent", monthly: 1_500_000, bucket: "needs", dueDay: 3 },
      {
        label: "Phone",
        monthly: 150_000,
        bucket: "needs",
        kind: "installment",
        endMonth: "2026-12",
      },
    ],
  };

  it("are grouped, and an installment says how many payments are left", () => {
    renderWithIntl(
      <IncomeExpensesForm initial={withExpenses} currentMonth="2026-10" onSave={vi.fn()} />,
    );
    expect(screen.getByTestId("expense-group-regular")).toHaveTextContent("Rent");
    expect(screen.getByTestId("expense-group-regular")).toHaveTextContent("Day 3");
    expect(screen.getByTestId("expense-group-installment")).toHaveTextContent("3 payments left");
  });

  it("can be edited, keeping its type", () => {
    const onSave = vi.fn();
    renderWithIntl(
      <IncomeExpensesForm initial={withExpenses} currentMonth="2026-10" onSave={onSave} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit Phone" }));
    expect(screen.getByLabelText("Name")).toHaveValue("Phone");
    expect(screen.getByLabelText("Payments left")).toHaveValue(3);
    type("Payments left", "2");
    submitPanel("Save changes");
    expect(onSave.mock.calls[0]?.[0].fixedExpenses[1]).toMatchObject({
      label: "Phone",
      kind: "installment",
      endMonth: "2026-11",
    });
  });

  it("can be removed and the removal undone", () => {
    const onSave = vi.fn();
    renderWithIntl(
      <IncomeExpensesForm initial={withExpenses} currentMonth="2026-10" onSave={onSave} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove Rent" }));
    expect(onSave.mock.calls[0]?.[0].fixedExpenses).toHaveLength(1);
    expect(screen.queryByTestId("expense-group-regular")).not.toBeInTheDocument();
  });

  it("show an empty state with an add button when there are none", () => {
    renderWithIntl(<IncomeExpensesForm initial={base} currentMonth="2026-10" onSave={vi.fn()} />);
    expect(screen.getByText("No expenses yet")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Add expense" })[0] as HTMLElement);
    expect(screen.getByRole("dialog", { name: "Add expense" })).toBeInTheDocument();
  });

  it("show saved pay day when editing", () => {
    const initial: Profile = { ...base, incomes: [{ label: "Job", monthly: 100_000, payDay: 20 }] };
    renderWithIntl(<IncomeExpensesForm initial={initial} onSave={vi.fn()} />);
    expect(screen.getByLabelText("Salary 1 pay day")).toHaveValue("20");
    expect(screen.getByLabelText("Salary 1 name")).toHaveValue("Job");
    expect(screen.getByLabelText("Salary 1 amount")).toHaveValue("1000");
  });
});
