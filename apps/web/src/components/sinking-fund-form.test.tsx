import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SinkingFund } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { SinkingFundForm } from "./sinking-fund-form";

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

const base = { createId: () => "new-fund", currentMonth: "2026-10" as const };

describe("SinkingFundForm", () => {
  it("adds a fund with money in major units", () => {
    const onSubmit = vi.fn();
    renderWithIntl(<SinkingFundForm {...base} onSubmit={onSubmit} />);
    type("Name", "Car insurance");
    type("Target amount", "6000");
    type("Due month", "2027-03");
    type("Saved so far", "1000.50");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onSubmit).toHaveBeenCalledWith({
      id: "new-fund",
      label: "Car insurance",
      target: 600_000,
      dueMonth: "2027-03",
      currentBalance: 100_050,
    } satisfies SinkingFund);
  });

  it("defaults the saved amount to nothing", () => {
    const onSubmit = vi.fn();
    renderWithIntl(<SinkingFundForm {...base} onSubmit={onSubmit} />);
    type("Name", "Holiday");
    type("Target amount", "100");
    type("Due month", "2027-01");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onSubmit.mock.calls[0]?.[0].currentBalance).toBe(0);
  });

  it("explains each missing field and submits nothing", () => {
    const onSubmit = vi.fn();
    renderWithIntl(<SinkingFundForm {...base} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("Enter a name.")).toBeInTheDocument();
    type("Name", "Trip");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("Enter a target above zero.")).toBeInTheDocument();
    type("Target amount", "100");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("Choose the month it is due.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears after adding so the next fund starts fresh", () => {
    renderWithIntl(<SinkingFundForm {...base} onSubmit={vi.fn()} />);
    type("Name", "Trip");
    type("Target amount", "100");
    type("Due month", "2027-01");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Target amount")).toHaveValue("");
  });

  describe("editing", () => {
    const existing: SinkingFund = {
      id: "f9",
      label: "Boiler service",
      target: 200_000,
      dueMonth: "2027-05",
      currentBalance: 50_000,
    };

    it("prefills, keeps the id, and saves changes", () => {
      const onSubmit = vi.fn();
      renderWithIntl(<SinkingFundForm {...base} initial={existing} onSubmit={onSubmit} />);
      expect(screen.getByLabelText("Name")).toHaveValue("Boiler service");
      expect(screen.getByLabelText("Target amount")).toHaveValue("2000");
      expect(screen.getByLabelText("Due month")).toHaveValue("2027-05");
      expect(screen.getByLabelText("Saved so far")).toHaveValue("500");

      type("Saved so far", "800");
      fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
      expect(onSubmit).toHaveBeenCalledWith({ ...existing, currentBalance: 80_000 });
    });

    it("offers cancel", () => {
      const onCancel = vi.fn();
      renderWithIntl(
        <SinkingFundForm {...base} initial={existing} onSubmit={vi.fn()} onCancel={onCancel} />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onCancel).toHaveBeenCalled();
    });
  });
});

describe("open pots", () => {
  it("saves an open pot with only a name: no target and no due month", () => {
    const onSubmit = vi.fn();
    renderWithIntl(<SinkingFundForm createId={() => "p1"} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("radio", { name: "Keeps growing" }));
    expect(screen.queryByLabelText("Due month")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Target amount")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Rainy day" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onSubmit).toHaveBeenCalledWith({
      id: "p1",
      label: "Rainy day",
      target: 0,
      currentBalance: 0,
    });
  });

  it("still needs a name", () => {
    const onSubmit = vi.fn();
    renderWithIntl(<SinkingFundForm createId={() => "p1"} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("radio", { name: "Keeps growing" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a name.")).toBeInTheDocument();
  });

  it("opens an existing open pot in the open mode, and switching it to a goal asks for a date", () => {
    const onSubmit = vi.fn();
    renderWithIntl(
      <SinkingFundForm
        createId={() => "x"}
        initial={{ id: "o", label: "Open", target: 0, currentBalance: 500 }}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByRole("radio", { name: "Keeps growing" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "For a goal" }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
