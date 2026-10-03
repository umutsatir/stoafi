import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CashFlowPoint } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { CashFlowChart } from "./cash-flow-chart";

function point(index: number): CashFlowPoint {
  const month = `2026-${String(index + 1).padStart(2, "0")}` as CashFlowPoint["month"];
  return {
    month,
    income: 1_000_000,
    obligations: 200_000,
    living: 300_000,
    personal: 0,
    installments: index < 3 ? 100_000 : 0,
    setAside: 0,
    left: index < 3 ? 400_000 : 500_000,
  };
}

describe("CashFlowChart", () => {
  it("draws one chart with a point per month", () => {
    const series = Array.from({ length: 12 }, (_, i) => point(i));
    renderWithIntl(<CashFlowChart series={series} />);
    const chart = screen.getByTestId("cash-flow-chart");
    expect(chart).toHaveAttribute("data-points", "12");
    expect(chart.querySelector("svg")).not.toBeNull();
  });

  it("gives screen readers the same numbers as a table", () => {
    renderWithIntl(<CashFlowChart series={[point(0), point(5)]} />);
    const rows = screen.getAllByRole("row");
    // header + 2 months
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent("2026-01");
    expect(rows[1]).toHaveTextContent("₺4,000.00");
  });

  it("renders an empty series without crashing", () => {
    renderWithIntl(<CashFlowChart series={[]} />);
    expect(screen.getByTestId("cash-flow-chart")).toHaveAttribute("data-points", "0");
  });
});
