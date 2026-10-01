import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BasketEntry } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { HoldingForm } from "./holding-forms";

const basket: BasketEntry[] = [
  { id: "gold", label: "Gold", typeId: "gold", percent: 60 },
  { id: "sp", label: "S&P 500", typeId: "index-fund", percent: 40 },
];

function renderForm(onSubmit = vi.fn(), withBasket = true) {
  renderWithIntl(
    <HoldingForm
      today="2026-10-01"
      currency="TRY"
      createId={() => "h1"}
      onCancel={vi.fn()}
      onSubmit={onSubmit}
      {...(withBasket ? { basket } : {})}
    />,
  );
}

describe("HoldingForm basket slice", () => {
  it("offers the basket slices and saves the one picked", () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Nasdaq fund" } });
    fireEvent.change(screen.getByLabelText("Basket slice"), { target: { value: "sp" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ label: "Nasdaq fund", basketId: "sp" });
  });

  it("leaves the slice out when the type should decide", () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Gram gold" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onSubmit.mock.calls[0]?.[0]).not.toHaveProperty("basketId");
  });

  it("does not ask when the user has no basket", () => {
    renderForm(vi.fn(), false);
    expect(screen.queryByLabelText("Basket slice")).not.toBeInTheDocument();
  });
});
