import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Card } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { CardWallet } from "./card-wallet";

const main: Card = {
  id: "m",
  label: "Bonus",
  statementDay: 15,
  dueDay: 5,
  kind: "main",
  bankId: "garanti-bbva",
  limit: 5_000_000,
  currentDebt: 1_000_000,
  last4: "1234",
  network: "mastercard",
};
const spouse: Card = {
  id: "s",
  label: "Spouse",
  statementDay: 20,
  dueDay: 10,
  kind: "supplementary",
  parentId: "m",
  bankId: "garanti-bbva",
};

function renderWallet(cards: Card[], extra: Partial<Parameters<typeof CardWallet>[0]> = {}) {
  const onSave = vi.fn();
  const onRemove = vi.fn();
  renderWithIntl(
    <CardWallet
      cards={cards}
      remainingInstallments={{}}
      currency="TRY"
      createId={() => "new-id"}
      onSave={onSave}
      onRemove={onRemove}
      {...extra}
    />,
  );
  return { onSave, onRemove };
}

describe("CardWallet empty state", () => {
  it("invites the first card and lets the user start from a bank", async () => {
    const { onSave } = renderWallet([]);
    expect(screen.getByText("Add your first card")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Akbank" }));

    const form = await screen.findByRole("dialog", { name: "Add a card" });
    expect(within(form).getByRole("radio", { name: "Akbank" })).toBeChecked();
    fireEvent.change(within(form).getByLabelText("Card name"), { target: { value: "Axess" } });
    fireEvent.click(within(form).getByRole("button", { name: "Add card" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: "new-id", label: "Axess", bankId: "akbank", kind: "main" }),
    );
  });
});

describe("CardWallet cards", () => {
  it("shows a card as a card, with its supplementary card tucked under it", () => {
    renderWallet([main, spouse]);
    expect(screen.getByTestId("card-m")).toHaveTextContent("Bonus");
    expect(screen.getByTestId("card-m")).toHaveTextContent("•••• 1234");
    expect(screen.getByTestId("card-s")).toHaveTextContent("Spouse");
    // Only one stack: the supplementary card is not a card of its own in the wallet.
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("keeps the minimum-payment calculator closed until asked", () => {
    renderWallet([main]);
    expect(screen.queryByText(/minimum payment %/i)).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", {
      name: /show the minimum-payment trap calculator/i,
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Minimum payment %")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /hide the minimum-payment trap calculator/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("opens a detail panel with the shared limit, and opens the calculator from the card with its debt", async () => {
    renderWallet([main, spouse], { remainingInstallments: { s: 500_000 } });
    fireEvent.click(screen.getByRole("button", { name: "Open Bonus" }));
    const panel = await screen.findByRole("dialog", { name: "Bonus" });
    // 10,000 owed + 5,000 of the spouse card's installments, of a 50,000 limit.
    expect(within(panel).getByTestId("limit-used-text")).toHaveTextContent("₺15,000.00");
    expect(within(panel).getByTestId("limit-used-text")).toHaveTextContent("₺50,000.00");
    expect(within(panel).getByTestId("limit-available")).toHaveTextContent("₺35,000.00");

    fireEvent.click(within(panel).getByRole("button", { name: "Only paying the minimum?" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByLabelText("Balance")).toHaveValue("10000");
  });

  it("says when a group is over its limit", async () => {
    renderWallet([main], { remainingInstallments: { m: 4_500_000 } });
    fireEvent.click(screen.getByRole("button", { name: "Open Bonus" }));
    const panel = await screen.findByRole("dialog", { name: "Bonus" });
    expect(within(panel).getByTestId("limit-available")).toHaveTextContent(/over the limit by/i);
  });

  it("shows a supplementary card's shared limit and offers no supplementary card of its own", async () => {
    renderWallet([main, spouse]);
    fireEvent.click(screen.getByRole("button", { name: /Open Spouse/ }));
    const panel = await screen.findByRole("dialog", { name: "Spouse" });
    expect(within(panel).getByText("Bonus")).toBeInTheDocument();
    expect(within(panel).getByText(/draw from one limit/i)).toBeInTheDocument();
    expect(
      within(panel).queryByRole("button", { name: "Add supplementary card" }),
    ).not.toBeInTheDocument();
  });
});

describe("CardWallet forms", () => {
  it("adds a supplementary card that belongs to the main card and has no limit field", async () => {
    const { onSave } = renderWallet([main]);
    fireEvent.click(screen.getByRole("button", { name: "Open Bonus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Add supplementary card" }));

    const form = await screen.findByRole("dialog", { name: "Add a supplementary card" });
    expect(within(form).queryByLabelText("Credit limit")).not.toBeInTheDocument();
    fireEvent.change(within(form).getByLabelText("Card name"), { target: { value: "Kid" } });
    fireEvent.change(within(form).getByLabelText("Due day"), { target: { value: "12" } });
    fireEvent.click(within(form).getByRole("button", { name: "Add card" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Kid",
        kind: "supplementary",
        parentId: "m",
        dueDay: 12,
      }),
    );
    expect(onSave.mock.calls[0]?.[0]).not.toHaveProperty("limit");
  });

  it("edits a card without changing its id", async () => {
    const { onSave } = renderWallet([main]);
    fireEvent.click(screen.getByRole("button", { name: "Open Bonus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    const form = await screen.findByRole("dialog", { name: "Edit card" });
    fireEvent.change(within(form).getByLabelText("Card name"), { target: { value: "Bonus Plus" } });
    fireEvent.click(within(form).getByRole("button", { name: "Save changes" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: "m", label: "Bonus Plus", limit: 5_000_000, last4: "1234" }),
    );
  });

  it("refuses a card without a name or with a bad last four digits and says why", async () => {
    const { onSave } = renderWallet([main]);
    fireEvent.click(screen.getByRole("button", { name: "Add card" }));
    const form = await screen.findByRole("dialog", { name: "Add a card" });
    fireEvent.change(within(form).getByLabelText("Last 4 digits"), { target: { value: "12" } });
    fireEvent.click(within(form).getByRole("button", { name: "Add card" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(within(form).getByText("Enter a name for the card.")).toBeInTheDocument();
    expect(within(form).getByText(/exactly four digits/i)).toBeInTheDocument();
  });

  it("requires choosing a main card for a supplementary card", async () => {
    const { onSave } = renderWallet([main]);
    fireEvent.click(screen.getByRole("button", { name: "Add card" }));
    const form = await screen.findByRole("dialog", { name: "Add a card" });
    fireEvent.change(within(form).getByLabelText("Card name"), { target: { value: "Kid" } });
    fireEvent.change(within(form).getByLabelText("Type"), { target: { value: "supplementary" } });
    fireEvent.click(within(form).getByRole("button", { name: "Add card" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(within(form).getByText(/choose the main card/i)).toBeInTheDocument();
  });

  it("only keeps the last four digits and never a longer number", async () => {
    renderWallet([]);
    fireEvent.click(screen.getByRole("button", { name: "Add card" }));
    const form = await screen.findByRole("dialog", { name: "Add a card" });
    fireEvent.change(within(form).getByLabelText("Last 4 digits"), {
      target: { value: "1234567812345678" },
    });
    expect(within(form).getByLabelText("Last 4 digits")).toHaveValue(
      "1234567812345678".slice(0, 4),
    );
  });
});

describe("CardWallet deleting", () => {
  async function openDelete() {
    fireEvent.click(screen.getByRole("button", { name: "Open Bonus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete Bonus" }));
    return screen.findByRole("dialog", { name: "Delete Bonus?" });
  }

  it("asks first, and cancelling removes nothing", async () => {
    const { onRemove } = renderWallet([main]);
    const dialog = await openDelete();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("deletes a plain card after confirmation", async () => {
    const { onRemove } = renderWallet([main]);
    const dialog = await openDelete();
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete card" }));
    expect(onRemove).toHaveBeenCalledWith(main, { supplementary: "delete" });
  });

  it("deletes a main card together with its supplementary cards", async () => {
    const { onRemove } = renderWallet([main, spouse]);
    const dialog = await openDelete();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete with supplementary cards" }),
    );
    expect(onRemove).toHaveBeenCalledWith(main, { supplementary: "delete" });
  });

  it("keeps supplementary cards as main cards only once each has a limit", async () => {
    const { onRemove } = renderWallet([main, spouse]);
    const dialog = await openDelete();
    fireEvent.click(within(dialog).getByRole("button", { name: "Keep supplementary cards" }));
    const confirm = within(dialog).getByRole("button", { name: "Delete and keep the rest" });
    expect(confirm).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText("Limit for Spouse"), {
      target: { value: "20000" },
    });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onRemove).toHaveBeenCalledWith(main, {
      supplementary: "detach",
      limits: { s: 2_000_000 },
    });
  });
});
