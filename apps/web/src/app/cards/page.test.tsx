import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import CardsPage from "./page";

beforeEach(async () => {
  await db.cards.clear();
  useAppStore.setState({ cards: [], hydrated: true });
});

describe("Cards screen", () => {
  it("saves an added card so it survives a reload", async () => {
    renderWithIntl(<CardsPage />);
    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Visa" } });
    fireEvent.click(screen.getByRole("button", { name: "Add card" }));

    expect(useAppStore.getState().cards).toHaveLength(1);
    await waitFor(async () => expect(await db.cards.count()).toBe(1));
    expect(await db.cards.toArray()).toEqual([
      expect.objectContaining({ label: "Visa", statementDay: 15, dueDay: 5 }),
    ]);
  });

  it("deletes a card from the screen and from storage", async () => {
    const card = { id: "visa", label: "Visa", statementDay: 15, dueDay: 5 };
    await db.cards.put(card);
    useAppStore.setState({ cards: [card] });
    renderWithIntl(<CardsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Visa" }));
    expect(useAppStore.getState().cards).toEqual([]);
    await waitFor(async () => expect(await db.cards.count()).toBe(0));
  });
});
