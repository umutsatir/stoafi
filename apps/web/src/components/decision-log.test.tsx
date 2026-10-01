import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Decision } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { DecisionLog } from "./decision-log";

const decisions: Decision[] = [
  {
    id: "d1",
    queueItemRef: "item-1",
    outcome: "bought",
    timestamp: "2026-10-03T10:00:00.000Z",
    amount: 1000,
  },
  {
    id: "d2",
    queueItemRef: "item-2",
    outcome: "postponed",
    timestamp: "2026-10-02T10:00:00.000Z",
    amount: 2000,
  },
  {
    id: "d3",
    queueItemRef: "item-3",
    itemName: "Jacket",
    outcome: "skipped",
    timestamp: "2026-09-20T10:00:00.000Z",
    amount: 500,
  },
  {
    id: "d4",
    queueItemRef: "item-4",
    itemName: "Watch",
    outcome: "skipped",
    timestamp: "2026-09-10T10:00:00.000Z",
    amount: 300,
  },
];

describe("DecisionLog", () => {
  it("renders the total saved from skipped decisions, bought total and postponed count", () => {
    renderWithIntl(<DecisionLog decisions={decisions} />);
    expect(screen.getByTestId("total-saved")).toHaveTextContent("₺8.00");
    expect(screen.getByTestId("total-bought")).toHaveTextContent("₺10.00");
    expect(screen.getByTestId("total-postponed")).toHaveTextContent("1");
  });

  it("expresses the saving as work days when the hourly income is known", () => {
    // 800 minor saved at 100 per hour = 8 hours = 1 work day.
    renderWithIntl(<DecisionLog decisions={decisions} hourlyNetIncome={100} />);
    expect(screen.getByText("About 1.0 work days of your time")).toBeInTheDocument();
  });

  it("falls back to a count when the hourly income is unknown", () => {
    renderWithIntl(<DecisionLog decisions={decisions} />);
    expect(screen.getByText("2 purchases skipped")).toBeInTheDocument();
  });

  it("labels each decision's outcome in words", () => {
    renderWithIntl(<DecisionLog decisions={decisions} />);
    expect(screen.getByTestId("outcome-d1")).toHaveTextContent("Bought");
    expect(screen.getByTestId("outcome-d2")).toHaveTextContent("Postponed");
    expect(screen.getByTestId("outcome-d3")).toHaveTextContent("Skipped");
  });

  it("groups decisions under month names, newest first", () => {
    renderWithIntl(<DecisionLog decisions={decisions} />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(["October 2026", "September 2026"]);
    expect(
      within(screen.getByTestId("month-2026-10")).getByTestId("decision-d1"),
    ).toBeInTheDocument();
  });

  it("shows the item name recorded with the decision, never the raw id", () => {
    renderWithIntl(<DecisionLog decisions={decisions} />);
    expect(screen.getByTestId("decision-d3")).toHaveTextContent("Jacket");
    expect(screen.queryByText(/item-3/)).not.toBeInTheDocument();
  });

  it("labels decisions from before names were stored as a deleted item", () => {
    renderWithIntl(<DecisionLog decisions={[decisions[0] as Decision]} />);
    expect(screen.getByTestId("decision-d1")).toHaveTextContent("Deleted item");
    expect(screen.queryByText("item-1")).not.toBeInTheDocument();
  });

  it("filters by outcome and says so when nothing matches", () => {
    renderWithIntl(<DecisionLog decisions={[decisions[0] as Decision]} />);
    fireEvent.click(screen.getByText("Skipped", { selector: "label" }));
    expect(screen.queryByTestId("decision-d1")).not.toBeInTheDocument();
    expect(screen.getByText("No decisions match this filter.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("All", { selector: "label" }));
    expect(screen.getByTestId("decision-d1")).toBeInTheDocument();
  });

  it("marks a decision whose risk the user knowingly accepted", () => {
    const risky: Decision = {
      ...(decisions[0] as Decision),
      breachedRuleIds: ["wants-limit"],
      guardBreachConfirmed: true,
    };
    renderWithIntl(<DecisionLog decisions={[risky, decisions[1] as Decision]} />);
    expect(screen.getByTestId("risk-d1")).toHaveTextContent("You knowingly accepted a risk");
    expect(screen.queryByTestId("risk-d2")).not.toBeInTheDocument();
    expect(screen.queryByText(/wants-limit/)).not.toBeInTheDocument();
  });

  it("offers add back for skipped and postponed decisions only, and delete for all", () => {
    const onAddBack = vi.fn();
    const onDelete = vi.fn();
    renderWithIntl(<DecisionLog decisions={decisions} onAddBack={onAddBack} onDelete={onDelete} />);
    const bought = screen.getByTestId("decision-d1");
    expect(
      within(bought).queryByRole("button", { name: /back to the queue/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add Jacket back to the queue" }));
    expect(onAddBack).toHaveBeenCalledWith(expect.objectContaining({ id: "d3" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete decision Jacket" }));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "d3" }));
  });
});
