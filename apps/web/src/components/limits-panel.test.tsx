import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MonthProjection } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { LimitsPanel } from "./limits-panel";

function projection(by: Record<"needs" | "wants" | "savings" | "investing", [number, number]>) {
  const entry = ([limit, committed]: [number, number]) => ({ limit, committed });
  return {
    month: "2026-10",
    income: 1_000_000,
    byBucket: {
      needs: entry(by.needs),
      wants: entry(by.wants),
      savings: entry(by.savings),
      investing: entry(by.investing),
    },
    installmentLoad: 0,
    sinkingSetAside: 0,
    freeCash: 0,
  } satisfies MonthProjection;
}

describe("LimitsPanel free spending and installments", () => {
  const wants = projection({
    needs: [0, 0],
    wants: [1_800_000, 825_000],
    savings: [0, 0],
    investing: [0, 0],
  });

  it("shows the free spending, and how it spreads over weeks and days", () => {
    renderWithIntl(
      <LimitsPanel
        projection={wants}
        queueFits={0}
        spending={{ monthly: 975_000, weekly: 227_500, daily: 32_500, fixed: false }}
      />,
    );
    expect(screen.getByTestId("free-spending-monthly")).toHaveTextContent("₺9,750.00");
    expect(screen.getByTestId("free-spending-spread")).toHaveTextContent(
      "₺2,275.00 a week, or ₺325.00 a day",
    );
    expect(screen.getByTestId("free-spending")).toHaveTextContent("What is left of your wants");
  });

  it("says when the amount is one the user set", () => {
    renderWithIntl(
      <LimitsPanel
        projection={wants}
        queueFits={0}
        spending={{ monthly: 1_500_000, weekly: 350_000, daily: 50_000, fixed: true }}
      />,
    );
    expect(screen.getByTestId("free-spending")).toHaveTextContent("The amount you set");
  });
});

describe("LimitsPanel", () => {
  it("shows what is left in each bucket and the plan limit it comes from", () => {
    renderWithIntl(
      <LimitsPanel
        queueFits={0}
        projection={projection({
          needs: [500_000, 200_000],
          wants: [300_000, 100_000],
          savings: [200_000, 200_000],
          investing: [0, 0],
        })}
      />,
    );
    expect(screen.getByTestId("left-needs")).toHaveTextContent("₺3,000.00 left");
    expect(screen.getByTestId("plan-needs")).toHaveTextContent("₺5,000.00");
    expect(screen.getByTestId("left-wants")).toHaveTextContent("₺2,000.00 left");
  });

  it("says by how much a bucket is over, and what to do about it", () => {
    renderWithIntl(
      <LimitsPanel
        queueFits={0}
        projection={projection({
          needs: [500_000, 520_000],
          wants: [300_000, 100_000],
          savings: [0, 0],
          investing: [0, 0],
        })}
      />,
    );
    expect(screen.getByTestId("left-needs")).toHaveTextContent("₺200.00 over");
    expect(screen.getByTestId("limit-state-needs")).toHaveTextContent("Over");
    const advice = within(screen.getByTestId("advice-needsOver"));
    expect(advice.getByText(/₺200\.00 over your plan/)).toBeInTheDocument();
    expect(advice.getByRole("link", { name: "Review expenses" })).toHaveAttribute(
      "href",
      "/income-expenses",
    );
  });

  it("points at the queue when wants have room and something fits", () => {
    renderWithIntl(
      <LimitsPanel
        queueFits={2}
        projection={projection({
          needs: [0, 0],
          wants: [300_000, 100_000],
          savings: [0, 0],
          investing: [0, 0],
        })}
      />,
    );
    const advice = within(screen.getByTestId("advice-wantsRoom"));
    expect(advice.getByText(/2 items from your queue fits this month/)).toBeInTheDocument();
    expect(advice.getByRole("link", { name: "Open queue" })).toHaveAttribute("href", "/queue");
  });

  it("tells how much is still to put into savings", () => {
    renderWithIntl(
      <LimitsPanel
        queueFits={0}
        projection={projection({
          needs: [0, 0],
          wants: [0, 0],
          savings: [200_000, 50_000],
          investing: [0, 0],
        })}
      />,
    );
    expect(screen.getByTestId("advice-savingsToSet")).toHaveTextContent(
      "₺1,500.00 more into savings",
    );
  });

  it("says all is well when nothing needs doing", () => {
    renderWithIntl(
      <LimitsPanel
        queueFits={0}
        projection={projection({
          needs: [0, 0],
          wants: [0, 0],
          savings: [0, 0],
          investing: [0, 0],
        })}
      />,
    );
    expect(screen.getByTestId("advice-allGood")).toBeInTheDocument();
  });

  it("speaks Turkish", () => {
    renderWithIntl(
      <LimitsPanel
        queueFits={1}
        projection={projection({
          needs: [0, 0],
          wants: [300_000, 100_000],
          savings: [0, 0],
          investing: [0, 0],
        })}
      />,
      "tr",
    );
    expect(screen.getByTestId("left-wants")).toHaveTextContent("kaldı");
    expect(screen.getByTestId("advice-wantsRoom")).toHaveTextContent("1 ürün bu ay sığıyor");
  });
});
