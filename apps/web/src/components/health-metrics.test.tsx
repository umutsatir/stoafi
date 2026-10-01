import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MonthProjection } from "@stoafi/core";
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

describe("HealthMetrics", () => {
  it("renders all four metrics matching direct selector output", () => {
    renderWithIntl(
      <HealthMetrics projection={projection} savingsBalance={30000} monthlyNeeds={5000} />,
    );

    // savingsRate = (1500+500)/10000 = 0.2 -> 20.0%
    expect(screen.getByTestId("savings-rate")).toHaveTextContent("20.0%");
    // emergencyFundMonths = 30000/5000 = 6
    expect(screen.getByTestId("emergency-fund-months")).toHaveTextContent("6.0 months");
    // installmentRatio = 1000/10000 = 0.1 -> 10.0%
    expect(screen.getByTestId("installment-ratio")).toHaveTextContent("10.0%");
    // runway = 30000/(5000+1000) = 5
    expect(screen.getByTestId("runway")).toHaveTextContent("5.0 months");
  });

  it("explains each metric in an (i) popover", () => {
    renderWithIntl(
      <HealthMetrics projection={projection} savingsBalance={30000} monthlyNeeds={5000} />,
    );
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
    renderWithIntl(
      <HealthMetrics
        projection={projection}
        savingsBalance={15000}
        monthlyNeeds={5000}
        emergencyFundTargetMonths={6}
      />,
    );
    // 3 of 6 months
    expect(screen.getByRole("progressbar", { name: "Emergency fund progress" })).toHaveTextContent(
      "50%",
    );
  });

  it("caps the ring at a full circle when the fund is above target", () => {
    renderWithIntl(
      <HealthMetrics
        projection={projection}
        savingsBalance={90000}
        monthlyNeeds={5000}
        emergencyFundTargetMonths={6}
      />,
    );
    expect(screen.getByRole("progressbar", { name: "Emergency fund progress" })).toHaveTextContent(
      "100%",
    );
  });
});
