import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Card } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { CardList } from "./card-list";

const visa: Card = { id: "visa", label: "Visa", statementDay: 15, dueDay: 5 };

function renderList(cards: Card[] = [], extra: Partial<Parameters<typeof CardList>[0]> = {}) {
  const onAdd = vi.fn();
  const onDelete = vi.fn();
  renderWithIntl(
    <CardList
      cards={cards}
      onAdd={onAdd}
      onDelete={onDelete}
      createId={() => "new-card"}
      {...extra}
    />,
  );
  return { onAdd, onDelete };
}

describe("CardList", () => {
  it("adds a card with its statement and due days", () => {
    const { onAdd } = renderList();
    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "  Garanti  " } });
    fireEvent.change(screen.getByLabelText("Statement day"), { target: { value: "20" } });
    fireEvent.change(screen.getByLabelText("Due day"), { target: { value: "28" } });
    fireEvent.click(screen.getByRole("button", { name: "Add card" }));
    expect(onAdd).toHaveBeenCalledWith({
      id: "new-card",
      label: "Garanti",
      statementDay: 20,
      dueDay: 28,
    });
  });

  it("clears the label after adding", () => {
    renderList();
    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Garanti" } });
    fireEvent.click(screen.getByRole("button", { name: "Add card" }));
    expect(screen.getByLabelText("Label")).toHaveValue("");
  });

  it("refuses a card without a name and says why", () => {
    const { onAdd } = renderList();
    fireEvent.click(screen.getByRole("button", { name: "Add card" }));
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a name for the card.")).toBeInTheDocument();
  });

  it("lists saved cards and deletes one", () => {
    const { onDelete } = renderList([visa]);
    expect(screen.getByTestId("card-visa")).toHaveTextContent("Visa: statement 15, due 5");
    fireEvent.click(screen.getByRole("button", { name: "Delete Visa" }));
    expect(onDelete).toHaveBeenCalledWith(visa);
  });
});
