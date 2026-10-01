import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it } from "vitest";
import type { Card, QueueItem } from "@stoafi/core";
import { Toaster } from "@/components/ui/toaster";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import CardsPage from "./page";

const main: Card = {
  id: "m",
  label: "Bonus",
  statementDay: 15,
  dueDay: 5,
  kind: "main",
  limit: 5_000_000,
};
const spouse: Card = {
  id: "s",
  label: "Spouse",
  statementDay: 20,
  dueDay: 10,
  kind: "supplementary",
  parentId: "m",
};

beforeEach(async () => {
  toast.dismiss();
  await db.cards.clear();
  useAppStore.setState({ cards: [], queueItems: [], today: "2026-10-15", hydrated: true });
});

function renderPage() {
  return renderWithIntl(
    <>
      <CardsPage />
      <Toaster />
    </>,
  );
}

describe("Cards screen", () => {
  it("saves an added card so it survives a reload", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Add card" }));
    const form = await screen.findByRole("dialog", { name: "Add a card" });
    fireEvent.change(within(form).getByLabelText("Card name"), { target: { value: "Visa" } });
    fireEvent.click(within(form).getByRole("button", { name: "Add card" }));

    expect(useAppStore.getState().cards).toHaveLength(1);
    await waitFor(async () => expect(await db.cards.count()).toBe(1));
    expect(await db.cards.toArray()).toEqual([
      expect.objectContaining({ label: "Visa", statementDay: 15, dueDay: 5, kind: "main" }),
    ]);
    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });

  it("deletes a card from the screen and storage, and undo brings it back", async () => {
    await db.cards.put(main);
    useAppStore.setState({ cards: [main] });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Open Bonus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete Bonus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete card" }));

    expect(useAppStore.getState().cards).toEqual([]);
    await waitFor(async () => expect(await db.cards.count()).toBe(0));

    fireEvent.click(await screen.findByRole("button", { name: "Undo" }));
    expect(useAppStore.getState().cards).toEqual([main]);
    await waitFor(async () => expect(await db.cards.count()).toBe(1));
  });

  it("keeps supplementary cards as main cards when asked, saving the change", async () => {
    await db.cards.bulkPut([main, spouse]);
    useAppStore.setState({ cards: [main, spouse] });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Open Bonus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete Bonus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Keep supplementary cards" }));
    fireEvent.change(screen.getByLabelText("Limit for Spouse"), { target: { value: "10000" } });
    fireEvent.click(screen.getByRole("button", { name: "Delete and keep the rest" }));

    expect(useAppStore.getState().cards).toEqual([
      expect.objectContaining({ id: "s", kind: "main", limit: 1_000_000 }),
    ]);
    await waitFor(async () => {
      const rows = await db.cards.toArray();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ id: "s", kind: "main", limit: 1_000_000 });
      expect(rows[0]).not.toHaveProperty("parentId");
    });
  });

  it("counts remaining installments bought with a card against its limit", async () => {
    const item: QueueItem = {
      id: "i",
      name: "Laptop",
      price: 3_000_000,
      urgency: 2,
      importance: 2,
      isNeed: false,
      expectedUses: 100,
      addedDate: "2026-09-01",
      priceUpdatedDate: "2026-09-01",
      order: 0,
      installmentPurchase: {
        offer: { months: 3, payments: [1_000_000, 1_000_000, 1_000_000] },
        firstMonth: "2026-10",
        cardId: "m",
      },
    };
    useAppStore.setState({ cards: [main], queueItems: [item] });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Open Bonus" }));
    const panel = await screen.findByRole("dialog", { name: "Bonus" });
    expect(within(panel).getByTestId("limit-used-text")).toHaveTextContent("₺30,000.00");
    expect(within(panel).getByTestId("owed-here")).toHaveTextContent("₺30,000.00");
  });
});
