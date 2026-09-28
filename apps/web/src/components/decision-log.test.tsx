import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Decision } from "@stoafi/core";
import { DecisionLog } from "./decision-log";

const decisions: Decision[] = [
  { id: "d1", queueItemRef: "item-1", outcome: "bought", timestamp: "t", amount: 1000 },
  { id: "d2", queueItemRef: "item-2", outcome: "postponed", timestamp: "t", amount: 2000 },
  { id: "d3", queueItemRef: "item-3", outcome: "skipped", timestamp: "t", amount: 500 },
  { id: "d4", queueItemRef: "item-4", outcome: "skipped", timestamp: "t", amount: 300 },
];

describe("DecisionLog", () => {
  it("renders the correct total saved from skipped decisions", () => {
    render(<DecisionLog decisions={decisions} />);
    expect(screen.getByTestId("total-saved")).toHaveTextContent("800");
  });

  it("renders the correct per-row outcome label for each decision", () => {
    render(<DecisionLog decisions={decisions} />);
    expect(screen.getByTestId("outcome-d1")).toHaveTextContent("bought");
    expect(screen.getByTestId("outcome-d2")).toHaveTextContent("postponed");
    expect(screen.getByTestId("outcome-d3")).toHaveTextContent("skipped");
  });
});
