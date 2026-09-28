import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Profile } from "@stoafi/core";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import ProfilePage from "../profile/page";
import IncomeExpensesPage from "./page";

const saved: Profile = {
  incomes: [{ label: "Job", monthly: 1_000_000 }],
  fixedExpenses: [],
  livingExpenses: 200_000,
  savings: 5_000_000,
  emergencyFundTargetMonths: 4,
  annualInflationExpectation: 0.5,
};

async function stored(): Promise<Profile> {
  const row = await db.profile.get("singleton");
  return row?.data as Profile;
}

beforeEach(async () => {
  await db.profile.clear();
  await db.profile.put({ id: "singleton", data: saved });
  useAppStore.setState({ profile: saved, queueItems: [], today: "2026-09-15", hydrated: true });
});

describe("Income & Expenses and Profile screens share one profile", () => {
  it("saving income and expenses keeps savings, target and inflation", async () => {
    renderWithIntl(<IncomeExpensesPage />);
    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));
    fireEvent.change(screen.getByLabelText("Expense 1 name"), { target: { value: "Rent" } });
    fireEvent.change(screen.getByLabelText("Expense 1 amount"), { target: { value: "3000" } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(async () => expect((await stored()).fixedExpenses).toHaveLength(1));
    expect(await stored()).toMatchObject({
      savings: 5_000_000,
      emergencyFundTargetMonths: 4,
      annualInflationExpectation: 0.5,
      livingExpenses: 200_000,
    });
  });

  it("saving settings keeps income and expenses", async () => {
    renderWithIntl(<ProfilePage />);
    fireEvent.change(screen.getByLabelText("Current savings"), { target: { value: "70000" } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(async () => expect((await stored()).savings).toBe(7_000_000));
    expect(await stored()).toMatchObject({
      incomes: [{ label: "Job", monthly: 1_000_000 }],
      livingExpenses: 200_000,
    });
  });

  it("lets a brand-new user save income before anything else exists", async () => {
    await db.profile.clear();
    useAppStore.setState({ profile: null });
    renderWithIntl(<IncomeExpensesPage />);
    fireEvent.change(screen.getByLabelText("Salary 1 name"), { target: { value: "Job" } });
    fireEvent.change(screen.getByLabelText("Salary 1 amount"), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(async () => expect((await stored())?.incomes).toHaveLength(1));
    expect(await stored()).toMatchObject({ savings: 0, emergencyFundTargetMonths: 6 });
  });

  it("lists installment purchases on the income and expenses screen", () => {
    useAppStore.setState({
      queueItems: [
        {
          id: "fridge",
          name: "Fridge",
          price: 600_000,
          urgency: 2,
          importance: 2,
          isNeed: true,
          expectedUses: 1,
          addedDate: "2026-01-01",
          priceUpdatedDate: "2026-01-01",
          order: 0,
          installmentPurchase: {
            offer: { months: 3, payments: [200_000, 200_000, 200_000] },
            firstMonth: "2026-09",
          },
        },
      ],
    });
    renderWithIntl(<IncomeExpensesPage />);
    expect(screen.getByTestId("installment-expense-fridge")).toBeInTheDocument();
  });
});
