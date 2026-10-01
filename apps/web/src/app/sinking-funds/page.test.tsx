import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { SinkingFund } from "@stoafi/core";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import SinkingFundsPage from "./page";

const fund: SinkingFund = {
  id: "insurance",
  label: "Car insurance",
  target: 600_000,
  dueMonth: "2027-04",
  currentBalance: 0,
};

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

beforeEach(async () => {
  await db.sinkingFunds.clear();
  useAppStore.setState({ sinkingFunds: [], today: "2026-10-15", hydrated: true });
});

describe("Sinking funds screen", () => {
  it("adds a fund, shows its monthly set-aside and saves it", async () => {
    renderWithIntl(<SinkingFundsPage />);
    type("Name", "Car insurance");
    type("Target amount", "6000");
    type("Due month", "2027-04");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    const [added] = useAppStore.getState().sinkingFunds;
    expect(added).toMatchObject({ label: "Car insurance", target: 600_000, dueMonth: "2027-04" });
    expect(screen.getByTestId(`sinking-status-${added?.id}`)).toHaveTextContent("₺1,000.00");
    await waitFor(async () => expect(await db.sinkingFunds.count()).toBe(1));
  });

  it("edits how much is saved and persists it", async () => {
    await db.sinkingFunds.put(fund);
    useAppStore.setState({ sinkingFunds: [fund] });
    renderWithIntl(<SinkingFundsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Edit Car insurance" }));
    type("Saved so far", "3000");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(useAppStore.getState().sinkingFunds[0]?.currentBalance).toBe(300_000);
    await waitFor(async () => {
      const row = (await db.sinkingFunds.get("insurance")) as SinkingFund | undefined;
      expect(row?.currentBalance).toBe(300_000);
    });
    // the form returns to "add" mode
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("deletes a fund and persists the deletion", async () => {
    await db.sinkingFunds.put(fund);
    useAppStore.setState({ sinkingFunds: [fund] });
    renderWithIntl(<SinkingFundsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Delete Car insurance" }));
    expect(useAppStore.getState().sinkingFunds).toEqual([]);
    await waitFor(async () => expect(await db.sinkingFunds.count()).toBe(0));
  });

  it("does not throw for a fund that is due this month", () => {
    useAppStore.setState({ sinkingFunds: [{ ...fund, dueMonth: "2026-10" }] });
    renderWithIntl(<SinkingFundsPage />);
    expect(screen.getByTestId("sinking-status-insurance")).toHaveTextContent("Due this month");
  });

  it("links to the sinking funds lesson", () => {
    renderWithIntl(<SinkingFundsPage />);
    expect(screen.getByTestId("lesson-link-sinking-funds")).toHaveAttribute(
      "href",
      "/lessons#sinking-funds",
    );
  });
});
