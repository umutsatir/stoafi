import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SinkingFund } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { SinkingFundList } from "./sinking-fund-list";

function fund(id: string, overrides: Partial<SinkingFund> = {}): SinkingFund {
  return {
    id,
    label: id,
    target: 600_000,
    dueMonth: "2027-04",
    currentBalance: 0,
    ...overrides,
  };
}

function renderList(
  funds: SinkingFund[],
  extra: Partial<Parameters<typeof SinkingFundList>[0]> = {},
) {
  return renderWithIntl(
    <SinkingFundList
      funds={funds}
      month="2026-10"
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      {...extra}
    />,
  );
}

describe("SinkingFundList", () => {
  it("shows the monthly set-aside for a fund with months left", () => {
    renderList([fund("Insurance")]);
    expect(screen.getByTestId("sinking-status-Insurance")).toHaveTextContent("₺1,000.00");
    expect(screen.getByTestId("sinking-status-Insurance")).toHaveTextContent("2027-04");
  });

  it("shows how much is saved of the target", () => {
    renderList([fund("Insurance", { currentBalance: 150_000 })]);
    expect(screen.getByTestId("sinking-fund-Insurance")).toHaveTextContent("₺1,500.00");
    expect(screen.getByTestId("sinking-fund-Insurance")).toHaveTextContent("₺6,000.00");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
  });

  it("says a fund is fully funded", () => {
    renderList([fund("Insurance", { currentBalance: 600_000 })]);
    expect(screen.getByTestId("sinking-status-Insurance")).toHaveTextContent("Fully funded");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("shows what is still missing for a fund due this month, not an error", () => {
    renderList([fund("Insurance", { dueMonth: "2026-10", currentBalance: 200_000 })]);
    const status = screen.getByTestId("sinking-status-Insurance");
    expect(status).toHaveTextContent("Due this month");
    expect(status).toHaveTextContent("₺4,000.00");
  });

  it("flags an overdue fund with its due month", () => {
    renderList([fund("Insurance", { dueMonth: "2026-08" })]);
    const status = screen.getByTestId("sinking-status-Insurance");
    expect(status).toHaveTextContent("Overdue since 2026-08");
    expect(status).toHaveTextContent("₺6,000.00");
  });

  it("caps the progress bar at 100 even if saved exceeds the target", () => {
    renderList([fund("Insurance", { currentBalance: 900_000 })]);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("shows an empty state", () => {
    renderList([]);
    expect(screen.getByText(/No savings goals yet/)).toBeInTheDocument();
  });

  it("offers edit and delete per fund", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderList([fund("Insurance")], { onEdit, onDelete });
    fireEvent.click(screen.getByRole("button", { name: "Edit Insurance" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Insurance" }));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "Insurance" }));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "Insurance" }));
  });
});
