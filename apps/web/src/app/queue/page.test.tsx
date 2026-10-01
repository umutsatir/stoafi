import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { installmentCommitments, savingsSummary, type Profile, type QueueItem } from "@stoafi/core";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import QueuePage from "./page";

const profile: Profile = {
  incomes: [{ label: "Job", monthly: 10_000_000 }],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 50_000_000,
  emergencyFundTargetMonths: 1,
  annualInflationExpectation: 0.3,
};

const item: QueueItem = {
  id: "headphones",
  name: "Headphones",
  price: 300_000,
  urgency: 2,
  importance: 2,
  isNeed: false,
  expectedUses: 100,
  addedDate: "2026-01-01",
  priceUpdatedDate: "2026-01-01",
  order: 0,
};

beforeEach(async () => {
  await db.queue.clear();
  await db.decisions.clear();
  useAppStore.setState({
    profile,
    planState: { strategyId: "fifty-thirty-twenty", params: {} },
    queueItems: [item],
    decisions: [],
    cards: [],
    guardThresholds: { installmentCapPct: 0.2 },
    today: "2026-09-15",
    hydrated: true,
  });
  await db.queue.put(item);
});

describe("QueuePage purchase flow", () => {
  it("adds a queue item from the form and saves it", async () => {
    renderWithIntl(<QueuePage />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Desk" } });
    fireEvent.change(screen.getByLabelText("Price"), { target: { value: "1500" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(useAppStore.getState().queueItems.map((i) => i.name)).toEqual(["Headphones", "Desk"]);
    await waitFor(async () => expect(await db.queue.count()).toBe(2));
    const saved = await db.queue.toArray();
    expect(saved.find((r) => r.name === "Desk")).toMatchObject({
      price: 150_000,
      order: 1,
      addedDate: "2026-09-15",
    });
  });

  it("records a cash purchase as a decision only and removes the item from the queue", async () => {
    renderWithIntl(<QueuePage />);
    fireEvent.click(screen.getByRole("button", { name: "Headphones" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    const state = useAppStore.getState();
    expect(state.queueItems).toEqual([]);
    expect(state.decisions).toHaveLength(1);
    expect(state.decisions[0]).toMatchObject({
      queueItemRef: "headphones",
      outcome: "bought",
      amount: 300_000,
    });
    expect(installmentCommitments(state.queueItems)).toEqual([]);

    await waitFor(async () => expect(await db.decisions.count()).toBe(1));
    expect(await db.queue.count()).toBe(0);
  });

  it("turns an installment purchase into an expense: item kept, flagged and saved", async () => {
    renderWithIntl(<QueuePage />);
    fireEvent.click(screen.getByRole("button", { name: "Headphones" }));
    fireEvent.click(screen.getByRole("button", { name: "Calculate with installments" }));
    fireEvent.click(screen.getByTestId("offer-row-3").querySelector("button") as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    const state = useAppStore.getState();
    const bought = state.queueItems[0];
    expect(bought?.installmentPurchase).toEqual({
      offer: { months: 3, payments: [100_000, 100_000, 100_000] },
      firstMonth: "2026-09",
    });
    expect(installmentCommitments(state.queueItems)).toHaveLength(1);
    expect(state.decisions[0]).toMatchObject({ outcome: "bought", amount: 300_000 });

    await waitFor(async () => {
      const row = (await db.queue.get("headphones")) as QueueItem | undefined;
      expect(row?.installmentPurchase?.firstMonth).toBe("2026-09");
    });
    await waitFor(async () => expect(await db.decisions.count()).toBe(1));

    // The bought item leaves the waiting list.
    expect(screen.queryByRole("button", { name: "Headphones" })).not.toBeInTheDocument();
  });

  it("deletes an item and persists the deletion", async () => {
    renderWithIntl(<QueuePage />);
    fireEvent.click(screen.getByRole("button", { name: "Delete Headphones" }));
    expect(useAppStore.getState().queueItems).toEqual([]);
    await waitFor(async () => expect(await db.queue.count()).toBe(0));
  });

  it("skipping records a skipped decision, removes the item and counts as money saved", async () => {
    renderWithIntl(<QueuePage />);
    fireEvent.click(screen.getByRole("button", { name: "Headphones" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));

    const state = useAppStore.getState();
    expect(state.queueItems).toEqual([]);
    expect(state.decisions[0]).toMatchObject({
      queueItemRef: "headphones",
      outcome: "skipped",
      amount: 300_000,
    });
    expect(savingsSummary(state.decisions).totalSaved).toBe(300_000);

    await waitFor(async () => expect(await db.decisions.count()).toBe(1));
    expect(await db.queue.count()).toBe(0);
    expect(screen.queryByRole("button", { name: "Headphones" })).not.toBeInTheDocument();
  });

  it("saves a skip at the cash price when the item has one", async () => {
    const withCash = { ...item, discountedCashPrice: 250_000 };
    useAppStore.setState({ queueItems: [withCash] });
    renderWithIntl(<QueuePage />);
    fireEvent.click(screen.getByRole("button", { name: "Headphones" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(useAppStore.getState().decisions[0]?.amount).toBe(250_000);
  });

  it("postponing records a postponed decision and keeps the item in the queue", async () => {
    renderWithIntl(<QueuePage />);
    fireEvent.click(screen.getByRole("button", { name: "Headphones" }));
    fireEvent.click(screen.getByRole("button", { name: "Postpone" }));

    const state = useAppStore.getState();
    expect(state.queueItems.map((i) => i.id)).toEqual(["headphones"]);
    expect(state.decisions[0]).toMatchObject({ outcome: "postponed", amount: 300_000 });
    expect(savingsSummary(state.decisions).totalSaved).toBe(0);
    await waitFor(async () => expect(await db.decisions.count()).toBe(1));
    expect(await db.queue.count()).toBe(1);
    // the preview closes after the decision
    expect(screen.queryByRole("button", { name: "Postpone" })).not.toBeInTheDocument();
  });

  it("shows the first month the scheduler finds room for the selected item", () => {
    renderWithIntl(<QueuePage />);
    fireEvent.click(screen.getByRole("button", { name: "Headphones" }));
    expect(screen.getByTestId("suggested-month")).toHaveTextContent("2026-09");
  });

  it("offers the saved cards in the preview", () => {
    useAppStore.setState({
      cards: [{ id: "visa", label: "Visa", statementDay: 15, dueDay: 5 }],
    });
    renderWithIntl(<QueuePage />);
    fireEvent.click(screen.getByRole("button", { name: "Headphones" }));
    expect(screen.getByLabelText("Pay with card")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Visa" })).toBeInTheDocument();
  });

  describe("installment cap from settings", () => {
    function pickThreeMonthOffer() {
      fireEvent.click(screen.getByRole("button", { name: "Headphones" }));
      fireEvent.click(screen.getByRole("button", { name: "Calculate with installments" }));
      fireEvent.click(screen.getByTestId("offer-row-3").querySelector("button") as HTMLElement);
    }

    it("does not flag a small installment under the default 20% cap", () => {
      renderWithIntl(<QueuePage />);
      pickThreeMonthOffer();
      expect(screen.queryByText(/installments would go above the cap/i)).not.toBeInTheDocument();
    });

    it("flags the same installment once the cap is lowered in settings", () => {
      // 1,000.00 a month against an income of 100,000.00: about 1%
      useAppStore.setState({ guardThresholds: { installmentCapPct: 0.005 } });
      renderWithIntl(<QueuePage />);
      pickThreeMonthOffer();
      expect(screen.getByTestId("guard-breaches")).toHaveTextContent(
        /installments would go above the cap/i,
      );
    });
  });
});
