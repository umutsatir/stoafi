import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import { AppBootstrap } from "./app-bootstrap";

describe("AppBootstrap", () => {
  it("renders nothing until saved data is loaded, then puts it in the store with today's date", async () => {
    await db.profile.put({
      id: "singleton",
      data: {
        incomes: [{ label: "Job", monthly: 100_000 }],
        fixedExpenses: [],
        livingExpenses: 0,
        savings: 0,
        emergencyFundTargetMonths: 6,
        annualInflationExpectation: 0.3,
      },
    });

    renderWithIntl(
      <AppBootstrap>
        <p>app ready</p>
      </AppBootstrap>,
    );
    expect(screen.queryByText("app ready")).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("app ready")).toBeInTheDocument());
    const state = useAppStore.getState();
    expect(state.profile?.incomes[0]?.monthly).toBe(100_000);
    expect(state.planState?.strategyId).toBe("fifty-thirty-twenty");
    expect(state.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(state.today).not.toBe("1970-01-01");
  });
});
