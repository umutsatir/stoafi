import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Decision } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { DecisionLog } from "./decision-log";

const decisions: Decision[] = [
  { id: "d1", queueItemRef: "item-1", outcome: "bought", timestamp: "t", amount: 1000 },
  { id: "d2", queueItemRef: "item-2", outcome: "postponed", timestamp: "t", amount: 2000 },
  { id: "d3", queueItemRef: "item-3", outcome: "skipped", timestamp: "t", amount: 500 },
  { id: "d4", queueItemRef: "item-4", outcome: "skipped", timestamp: "t", amount: 300 },
];

describe("DecisionLog", () => {
  it("shows the item name recorded with the decision, never the raw id", () => {
    renderWithIntl(
      <DecisionLog
        decisions={[
          {
            id: "d9",
            queueItemRef: "0d2c0c09-2123-4e37",
            itemName: "Headphones",
            outcome: "skipped",
            timestamp: "t",
            amount: 100,
          },
        ]}
      />,
    );
    expect(screen.getByTestId("decision-d9")).toHaveTextContent("Headphones");
    expect(screen.queryByText(/0d2c0c09/)).not.toBeInTheDocument();
  });

  it("labels decisions from before names were stored as a deleted item", () => {
    renderWithIntl(<DecisionLog decisions={[decisions[0] as Decision]} />);
    expect(screen.getByTestId("decision-d1")).toHaveTextContent("Deleted item");
    expect(screen.queryByText("item-1")).not.toBeInTheDocument();
  });

  it("renders the correct total saved from skipped decisions", () => {
    renderWithIntl(<DecisionLog decisions={decisions} />);
    expect(screen.getByTestId("total-saved")).toHaveTextContent("₺8.00");
  });

  it("renders the correct per-row outcome label for each decision", () => {
    renderWithIntl(<DecisionLog decisions={decisions} />);
    expect(screen.getByTestId("outcome-d1")).toHaveTextContent("bought");
    expect(screen.getByTestId("outcome-d2")).toHaveTextContent("postponed");
    expect(screen.getByTestId("outcome-d3")).toHaveTextContent("skipped");
  });
});
