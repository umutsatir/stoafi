import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Profile } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { ProfileForm } from "./profile-form";

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("ProfileForm settings", () => {
  it("saves savings, the emergency fund target and inflation as ratios and minor units", () => {
    const onSave = vi.fn();
    renderWithIntl(<ProfileForm onSave={onSave} />);
    type("Current savings", "10000");
    type("Emergency fund target (months)", "4");
    type("Annual inflation expectation", "45");
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0]?.[0];
    expect(saved.savings).toBe(1_000_000);
    expect(saved.emergencyFundTargetMonths).toBe(4);
    expect(saved.annualInflationExpectation).toBeCloseTo(0.45, 10);
  });

  it("shows inflation as a percent, not a ratio", () => {
    renderWithIntl(<ProfileForm onSave={vi.fn()} />);
    expect(screen.getByLabelText("Annual inflation expectation")).toHaveValue("30");
  });

  it("shows saved values when editing an existing profile", () => {
    const initial: Profile = {
      incomes: [],
      fixedExpenses: [],
      livingExpenses: 0,
      savings: 250_050,
      emergencyFundTargetMonths: 3,
      annualInflationExpectation: 0.5,
    };
    renderWithIntl(<ProfileForm initial={initial} onSave={vi.fn()} />);
    expect(screen.getByLabelText("Current savings")).toHaveValue("2500.5");
    expect(screen.getByLabelText("Emergency fund target (months)")).toHaveValue(3);
    expect(screen.getByLabelText("Annual inflation expectation")).toHaveValue("50");
  });

  it("does not ask for salaries or expenses any more", () => {
    renderWithIntl(<ProfileForm onSave={vi.fn()} />);
    expect(screen.queryByLabelText("Salary 1 name")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add expense" })).not.toBeInTheDocument();
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

    it("remembers the chosen country across reloads", () => {
      const onSave = vi.fn();
      const { unmount } = renderWithIntl(<ProfileForm onSave={onSave} />);
      fireEvent.change(screen.getByLabelText("Country"), { target: { value: "TR" } });
      fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
      const saved = onSave.mock.calls[0]?.[0];
      expect(saved.countryCode).toBe("TR");
      unmount();

      renderWithIntl(
        <ProfileForm
          onSave={onSave}
          initial={{
            incomes: [],
            fixedExpenses: [],
            livingExpenses: 0,
            savings: 0,
            emergencyFundTargetMonths: 6,
            annualInflationExpectation: 0.38,
            countryCode: "TR",
          }}
        />,
      );
      expect(screen.getByLabelText("Country")).toHaveValue("TR");
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

  it("shows what inflation does to a price, and updates as the rate changes", () => {
    renderWithIntl(<ProfileForm onSave={vi.fn()} />);
    expect(screen.getByTestId("inflation-insight")).toHaveTextContent("₺1,300.00");
    type("Annual inflation expectation", "50");
    expect(screen.getByTestId("inflation-insight")).toHaveTextContent("₺1,500.00");
  });
});
