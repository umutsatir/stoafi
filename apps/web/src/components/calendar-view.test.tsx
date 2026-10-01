import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Card, Profile } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { CalendarView } from "./calendar-view";

const profile: Profile = {
  incomes: [{ label: "Job", monthly: 6_000_000, payDay: 15 }],
  fixedExpenses: [
    { label: "Rent", monthly: 1_800_000, bucket: "needs", dueDay: 1 },
    { label: "Loan", monthly: 400_000, bucket: "needs", dueDay: 31, endMonth: "2026-11" },
  ],
  livingExpenses: 0,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};
const card: Card = { id: "c", label: "Bonus", statementDay: 1, dueDay: 5 };

describe("CalendarView", () => {
  it("shows the month and lists pay days, bills and card due dates", () => {
    renderWithIntl(<CalendarView profile={profile} cards={[card]} today="2026-10-20" />);
    expect(screen.getByTestId("calendar-month")).toHaveTextContent("October 2026");
    expect(screen.getByTestId("calendar-event-income-0")).toHaveTextContent("Pay day");
    expect(screen.getByTestId("calendar-event-expense-0")).toHaveTextContent("Oct 1");
    expect(screen.getByTestId("calendar-event-card-c")).toHaveTextContent("Card due");
    expect(screen.getByTestId("calendar-in")).toHaveTextContent("₺60,000.00");
    expect(screen.getByTestId("calendar-out")).toHaveTextContent("₺22,000.00");
  });

  it("marks today and starts weeks on Monday", () => {
    renderWithIntl(<CalendarView profile={profile} cards={[]} today="2026-10-20" />);
    expect(screen.getByTestId("day-20").className).toMatch(/border-primary/);
    expect(screen.getByTestId("day-1")).toBeInTheDocument();
    expect(screen.getByTestId("day-31")).toBeInTheDocument();
    expect(screen.queryByTestId("day-32")).not.toBeInTheDocument();
  });

  it("moves between months and clamps a day the month does not have", () => {
    renderWithIntl(<CalendarView profile={profile} cards={[]} today="2026-10-20" />);
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByTestId("calendar-month")).toHaveTextContent("November 2026");
    // The loan is due on the 31st; November has 30 days.
    expect(within(screen.getByTestId("day-30")).getByText("30")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-event-expense-1")).toHaveTextContent("Nov 30");
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.queryByTestId("calendar-event-expense-1")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByTestId("calendar-month")).toHaveTextContent("October 2026");
  });

  it("says so when nothing is due", () => {
    renderWithIntl(
      <CalendarView
        profile={{ ...profile, incomes: [], fixedExpenses: [] }}
        cards={[]}
        today="2026-10-20"
      />,
    );
    expect(screen.getByText("Nothing is due this month.")).toBeInTheDocument();
  });
});
