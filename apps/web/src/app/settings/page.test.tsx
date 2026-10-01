import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import SettingsPage from "./page";

beforeEach(async () => {
  await db.guards.clear();
  useAppStore.setState({ guardThresholds: { installmentCapPct: 0.2 }, hydrated: true });
});

describe("Settings screen installment cap", () => {
  it("saves a new cap so the queue and a reload use it", async () => {
    renderWithIntl(<SettingsPage />);
    fireEvent.change(screen.getByLabelText("Installment cap (% of net income)"), {
      target: { value: "10" },
    });
    expect(useAppStore.getState().guardThresholds.installmentCapPct).toBeCloseTo(0.1, 10);
    await waitFor(async () => {
      const row = await db.guards.get("singleton");
      expect((row?.data as { installmentCapPct: number }).installmentCapPct).toBeCloseTo(0.1, 10);
    });
  });
});

describe("Settings screen sections", () => {
  it("groups settings under headings and offers the AI export once there is a profile", () => {
    useAppStore.setState({
      profile: {
        incomes: [{ label: "Job", monthly: 6_000_000 }],
        fixedExpenses: [],
        livingExpenses: 0,
        savings: 0,
        emergencyFundTargetMonths: 6,
        annualInflationExpectation: 0.3,
      },
    });
    renderWithIntl(<SettingsPage />);
    for (const name of ["General", "Rules", "Your data", "Ask an AI", "About"]) {
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Ask Claude" })).toBeInTheDocument();
    expect(screen.getByLabelText("Currency")).toBeInTheDocument();
  });

  it("keeps the AI export out of sight until there is something to share", () => {
    useAppStore.setState({ profile: null });
    renderWithIntl(<SettingsPage />);
    expect(screen.queryByTestId("ai-section")).not.toBeInTheDocument();
    expect(screen.getByText(/never leaves this device/)).toBeInTheDocument();
  });
});
