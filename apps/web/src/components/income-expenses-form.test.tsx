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

function addSalary(name: string, amount: string, day?: string) {
  fireEvent.click(screen.getAllByRole("button", { name: "Add income" })[0] as HTMLElement);
  const dialog = screen.getByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText("Name"), { target: { value: name } });
  fireEvent.change(within(dialog).getByLabelText("Monthly amount"), { target: { value: amount } });
  if (day) fireEvent.change(within(dialog).getByLabelText("Pay day"), { target: { value: day } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Add" }));
}

describe("IncomeExpensesForm", () => {
  it("saves two salaries at once as integer minor units, then living costs with the button", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm onSave={onSave} />);

    addSalary("Main job", "30000");
    addSalary("Partner", "12500.50");
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave.mock.calls[1]?.[0].incomes).toEqual([
      { label: "Main job", monthly: 3_000_000 },
      { label: "Partner", monthly: 1_250_050 },
    ]);
    expect(screen.getByTestId("salary-total")).toHaveTextContent("₺42,500.50");

    type("Monthly living costs", "9000");
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(onSave).toHaveBeenLastCalledWith({
      incomes: [
        { label: "Main job", monthly: 3_000_000 },
        { label: "Partner", monthly: 1_250_050 },
      ],
      fixedExpenses: [],
      livingExpenses: 900_000,
    });
  });

  it("removes a salary, and undo brings it back", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm onSave={onSave} />);
    addSalary("A", "1");
    addSalary("B", "2");
    fireEvent.click(screen.getByRole("button", { name: "Remove A" }));
    expect(onSave.mock.calls.at(-1)?.[0].incomes).toEqual([{ label: "B", monthly: 200 }]);
    expect(screen.queryByTestId("salary-row-1")).not.toBeInTheDocument();
  });

  it("edits a salary in place", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm initial={base} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit Job" }));
    const dialog = screen.getByRole("dialog", { name: "Edit income" });
    expect(within(dialog).getByLabelText("Name")).toHaveValue("Job");
    fireEvent.change(within(dialog).getByLabelText("Monthly amount"), {
      target: { value: "60000" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(onSave.mock.calls.at(-1)?.[0].incomes).toEqual([{ label: "Job", monthly: 6_000_000 }]);
  });

  it("asks for a name and an amount before adding a salary", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm onSave={onSave} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Add income" })[0] as HTMLElement);
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Write a name.")).toBeInTheDocument();
  });

  it("shows an empty state when there is no income yet", () => {
    renderWithIntl(<IncomeExpensesForm onSave={vi.fn()} />);
    expect(screen.getByText("No income yet")).toBeInTheDocument();
  });

  it("requires nothing to save (no multi-step wizard)", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0]?.[0].incomes).toEqual([]);
  });

  it("uses the Turkish decimal comma when typing amounts", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm onSave={onSave} />, "tr");
    fireEvent.click(screen.getAllByRole("button", { name: "Gelir ekle" })[0] as HTMLElement);
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Ad"), { target: { value: "İş" } });
    fireEvent.change(within(dialog).getByLabelText("Aylık tutar"), {
      target: { value: "1.250,50" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Ekle" }));
    expect(onSave.mock.calls[0]?.[0].incomes).toEqual([{ label: "İş", monthly: 125_050 }]);
  });

  it("saves a pay day only when the user picks one", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm onSave={onSave} />);
    addSalary("Job", "1000");
    expect(onSave.mock.calls[0]?.[0].incomes).toEqual([{ label: "Job", monthly: 100_000 }]);
    addSalary("Side", "500", "15");
    expect(onSave.mock.calls[1]?.[0].incomes[1]).toEqual({
      label: "Side",
      monthly: 50_000,
      payDay: 15,
    });
  });
});

describe("living costs", () => {
  const withIncome: Profile = { ...base, annualInflationExpectation: 0.4 };

  it("says what share of income they are and how that looks", () => {
    renderWithIntl(<IncomeExpensesForm initial={withIncome} onSave={vi.fn()} />);
    expect(screen.queryByTestId("living-check")).not.toBeInTheDocument();
    type("Monthly living costs", "20000"); // 40% of 50,000
    expect(screen.getByTestId("living-check")).toHaveTextContent("This is 40% of your income.");
    expect(screen.getByTestId("living-band")).toHaveTextContent("Typical");
  });

  it("shows what the costs become after a year of expected inflation", () => {
    renderWithIntl(<IncomeExpensesForm initial={withIncome} onSave={vi.fn()} />);
    type("Monthly living costs", "10000");
    expect(screen.getByTestId("living-next-year")).toHaveTextContent(
      "At 40% inflation these costs become about ₺14,000.00 a month in a year, ₺4,000.00 more.",
    );
  });

  it("compares the user's own rise with expected inflation when last year's figure is given", () => {
    renderWithIntl(<IncomeExpensesForm initial={withIncome} onSave={vi.fn()} />);
    type("Monthly living costs", "15000");
    type("A year ago (optional)", "10000"); // +50% against 40% expected
    expect(screen.getByTestId("living-own-rise")).toHaveTextContent(
      "rose 50% in a year, faster than the 40%",
    );
  });

  it("saves last year's figure, and leaves it out when cleared", () => {
    const onSave = vi.fn();
    renderWithIntl(<IncomeExpensesForm initial={withIncome} onSave={onSave} />);
    type("Monthly living costs", "15000");
    type("A year ago (optional)", "10000");
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(onSave.mock.calls[0]?.[0].livingExpensesYearAgo).toBe(1_000_000);
    type("A year ago (optional)", "0");
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(onSave.mock.calls[1]?.[0]).not.toHaveProperty("livingExpensesYearAgo");
  });

  it("gives no share verdict without income", () => {
    renderWithIntl(<IncomeExpensesForm onSave={vi.fn()} />);
    type("Monthly living costs", "10000");
    expect(screen.queryByTestId("living-band")).not.toBeInTheDocument();
    expect(screen.getByTestId("living-next-year")).toBeInTheDocument();
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

describe("installments on a card", () => {
  const cards = [
    { id: "c1", label: "Bonus", kind: "main" as const, limit: 5_000_000 },
  ] as unknown as import("@stoafi/core").Card[];

  it("offers the user's cards for an installment, and saves the one picked", () => {
    const onSave = vi.fn();
    renderWithIntl(
      <IncomeExpensesForm initial={base} currentMonth="2026-09" cards={cards} onSave={onSave} />,
    );
    openAdd("Installment");
    type("Name", "Phone");
    type("Monthly payment", "1500");
    fireEvent.change(screen.getByLabelText("Card (optional)"), { target: { value: "c1" } });
    submitPanel();
    expect(onSave.mock.calls[0]?.[0].fixedExpenses[0]).toMatchObject({
      kind: "installment",
      cardId: "c1",
    });
  });

  it("does not ask for a card on a loan or a bill, or when the user has no cards", () => {
    renderWithIntl(
      <IncomeExpensesForm initial={base} currentMonth="2026-09" cards={cards} onSave={vi.fn()} />,
    );
    openAdd("Loan");
    expect(screen.queryByLabelText("Card (optional)")).not.toBeInTheDocument();
  });

  it("leaves the card out when none is chosen", () => {
    const onSave = vi.fn();
    renderWithIntl(
      <IncomeExpensesForm initial={base} currentMonth="2026-09" cards={cards} onSave={onSave} />,
    );
    openAdd("Installment");
    type("Name", "TV");
    type("Monthly payment", "500");
    submitPanel();
    expect(onSave.mock.calls[0]?.[0].fixedExpenses[0]).not.toHaveProperty("cardId");
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

  it("shows saved incomes with their pay day", () => {
    const initial: Profile = { ...base, incomes: [{ label: "Job", monthly: 100_000, payDay: 20 }] };
    renderWithIntl(<IncomeExpensesForm initial={initial} onSave={vi.fn()} />);
    expect(screen.getByTestId("salary-row-0")).toHaveTextContent("Job");
    expect(screen.getByTestId("salary-row-0")).toHaveTextContent("Paid on day 20");
  });
});
