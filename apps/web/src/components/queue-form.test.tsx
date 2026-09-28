import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { QueueItem } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { QueueForm } from "./queue-form";

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

const base = { today: "2026-09-28", nextOrder: 3, createId: () => "new-id" };

describe("QueueForm", () => {
  it("adds a want with price in major units and today's dates", () => {
    const onSubmit = vi.fn();
    renderWithIntl(<QueueForm {...base} onSubmit={onSubmit} />);

    type("Name", "Headphones");
    type("Price", "2500");
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "need" } });
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "want" } });
    fireEvent.change(screen.getByLabelText("Urgency"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Importance"), { target: { value: "2" } });
    type("Expected uses", "200");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onSubmit).toHaveBeenCalledWith({
      id: "new-id",
      name: "Headphones",
      price: 250_000,
      urgency: 3,
      importance: 2,
      isNeed: false,
      expectedUses: 200,
      addedDate: "2026-09-28",
      priceUpdatedDate: "2026-09-28",
      order: 3,
    } satisfies QueueItem);
  });

  it("saves an optional cash price only when one is entered", () => {
    const onSubmit = vi.fn();
    renderWithIntl(<QueueForm {...base} onSubmit={onSubmit} />);
    type("Name", "Laptop");
    type("Price", "30000");
    type("Cash price (optional)", "27500.50");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onSubmit.mock.calls[0]?.[0].discountedCashPrice).toBe(2_750_050);
  });

  it("refuses an empty name or a zero price and says why", () => {
    const onSubmit = vi.fn();
    renderWithIntl(<QueueForm {...base} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a name.")).toBeInTheDocument();

    type("Name", "Desk");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a price above zero.")).toBeInTheDocument();
  });

  it("clears the form after adding so the next item starts fresh", () => {
    renderWithIntl(<QueueForm {...base} onSubmit={vi.fn()} />);
    type("Name", "Desk");
    type("Price", "100");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Price")).toHaveValue("");
  });

  describe("editing", () => {
    const existing: QueueItem = {
      id: "item-9",
      name: "Bike",
      price: 500_000,
      urgency: 1,
      importance: 2,
      isNeed: true,
      expectedUses: 100,
      addedDate: "2026-01-10",
      priceUpdatedDate: "2026-01-10",
      order: 7,
      installmentOffers: [{ months: 3, payments: [1, 2, 3] }],
    };

    it("prefills, keeps id, order, added date and offers, and saves changes", () => {
      const onSubmit = vi.fn();
      renderWithIntl(<QueueForm {...base} initial={existing} onSubmit={onSubmit} />);
      expect(screen.getByLabelText("Name")).toHaveValue("Bike");
      expect(screen.getByLabelText("Price")).toHaveValue("5000");

      type("Name", "City bike");
      fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

      const saved = onSubmit.mock.calls[0]?.[0] as QueueItem;
      expect(saved).toMatchObject({
        id: "item-9",
        name: "City bike",
        order: 7,
        addedDate: "2026-01-10",
        priceUpdatedDate: "2026-01-10",
        installmentOffers: existing.installmentOffers,
      });
    });

    it("bumps the price-updated date when the price changes", () => {
      const onSubmit = vi.fn();
      renderWithIntl(<QueueForm {...base} initial={existing} onSubmit={onSubmit} />);
      type("Price", "4500");
      fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
      expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
        price: 450_000,
        priceUpdatedDate: "2026-09-28",
      });
    });

    it("offers cancel", () => {
      const onCancel = vi.fn();
      renderWithIntl(
        <QueueForm {...base} initial={existing} onSubmit={vi.fn()} onCancel={onCancel} />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onCancel).toHaveBeenCalled();
    });
  });
});
