import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  healthSummary,
  type HealthInputs,
  type MonthProjection,
  type Snapshot,
} from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { HealthMetrics } from "./health-metrics";

const projection: MonthProjection = {
  month: "2026-09",
  income: 10000,
  byBucket: {
    needs: { limit: 5000, committed: 4000 },
    wants: { limit: 3000, committed: 2000 },
    savings: { limit: 2000, committed: 1500 },
    investing: { limit: 0, committed: 500 },
  },
  installmentLoad: 1000,
  sinkingSetAside: 0,
  freeCash: 1000,
};

function render(over: Partial<HealthInputs> = {}, snapshots: Snapshot[] = []) {
  const inputs: HealthInputs = {
    projection,
    savingsBalance: 30000,
    monthlyNeeds: 5000,
    depositedThisMonth: 0,
    emergencyFundTargetMonths: 6,
    installmentCapPct: 0.2,
    ...over,
  };
  renderWithIntl(
    <HealthMetrics
      summary={healthSummary(inputs)}
      emergencyFundTargetMonths={inputs.emergencyFundTargetMonths}
      installmentCapPct={inputs.installmentCapPct}
      snapshots={snapshots}
    />,
  );
}

describe("HealthMetrics", () => {
  it("shows all four metrics with units and the values the selectors give", () => {
    render();
    // (1500+500)/10000 = 20%
    expect(screen.getByTestId("savings-rate")).toHaveTextContent("20.0%");
    expect(screen.getByTestId("emergency-fund-months")).toHaveTextContent("6.0 months");
    expect(screen.getByTestId("installment-ratio")).toHaveTextContent("10.0%");
    expect(screen.getByTestId("runway")).toHaveTextContent("5.0 months");
  });

  it("rates a month with a saved fifth of income but a half-built fund as watch", () => {
    render();
    expect(screen.getByTestId("overall-status")).toHaveTextContent("Watch");
  });

  it("gives an overall status, the reason, and a fix button to the first step", () => {
    render({ savingsBalance: 5000, projection: { ...projection, installmentLoad: 3500 } });
    expect(screen.getByTestId("overall-status")).toHaveTextContent("At risk");
    expect(screen.getByRole("link", { name: /Fix this/ })).toHaveAttribute(
      "href",
      "/sinking-funds",
    );
    expect(screen.getByTestId("step-build-emergency-fund")).toBeInTheDocument();
    expect(screen.getByTestId("step-reduce-installments")).toBeInTheDocument();
  });

  it("shows a calm all-good summary when every metric is good", () => {
    render({
      savingsBalance: 90000,
      projection: { ...projection, installmentLoad: 0 },
    });
    expect(screen.getByTestId("overall-status")).toHaveTextContent("Good");
    expect(screen.getByText("Everything is on track. Keep going.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Fix this/ })).not.toBeInTheDocument();
  });

  it("explains each metric in an (i) popover", () => {
    render();
    for (const name of [
      "What is the savings rate?",
      "What are emergency fund months?",
      "What is the installment ratio?",
      "What is the runway?",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("shows how far the emergency fund is toward its target, capped at 100 percent", () => {
    render({ savingsBalance: 15000 });
    expect(screen.getByRole("progressbar", { name: "Emergency fund progress" })).toHaveTextContent(
      "50%",
    );
  });

  it("caps the ring at a full circle when the fund is above target", () => {
    render({ savingsBalance: 90000 });
    expect(screen.getByRole("progressbar", { name: "Emergency fund progress" })).toHaveTextContent(
      "100%",
    );
  });

  it("counts money put into pots this month in the savings rate", () => {
    render({
      projection: {
        ...projection,
        byBucket: {
          ...projection.byBucket,
          savings: { limit: 0, committed: 0 },
          investing: { limit: 0, committed: 0 },
        },
      },
      depositedThisMonth: 2000,
    });
    expect(screen.getByTestId("savings-rate")).toHaveTextContent("20.0%");
  });
});

describe("HealthMetrics trends", () => {
  const snap = (month: string, over: Partial<Snapshot> = {}): Snapshot => ({
    id: month,
    month: month as Snapshot["month"],
    income: 6_000_000,
    left: 1_000_000,
    savingsRate: 0.1,
    installmentRatio: 0.2,
    emergencyMonths: 2,
    runwayMonths: 2,
    wealth: 10_000_000,
    ...over,
  });

  it("says trends are coming until there are two months", () => {
    render({}, [snap("2026-09")]);
    expect(screen.getByText(/once you have two months/)).toBeInTheDocument();
    expect(screen.queryByTestId("trend-savingsRate")).not.toBeInTheDocument();
  });

  it("draws a line per number and says if it moved the right way", () => {
    render({}, [
      snap("2026-08", { savingsRate: 0.05, installmentRatio: 0.1, wealth: 9_000_000 }),
      snap("2026-09", { savingsRate: 0.12, installmentRatio: 0.2, wealth: 10_000_000 }),
    ]);
    expect(screen.getByTestId("trend-savingsRate")).toHaveTextContent("12.0%");
    expect(screen.getByTestId("trend-change-savingsRate")).toHaveTextContent(
      "▲ 7.0 points · better",
    );
    // A rising installment load is worse.
    expect(screen.getByTestId("trend-change-installmentRatio")).toHaveTextContent(
      "▲ 10.0 points · worse",
    );
    expect(screen.getByTestId("trend-change-wealth")).toHaveTextContent("▲ ₺10,000.00 · better");
    expect(screen.getAllByRole("img", { name: /over the last 2 months/ })).toHaveLength(4);
  });

  it("says no change when nothing moved", () => {
    render({}, [snap("2026-08"), snap("2026-09")]);
    expect(screen.getByTestId("trend-change-emergencyMonths")).toHaveTextContent(
      "No change since last month",
    );
  });
});
