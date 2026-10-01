import { fireEvent, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { BasketEntry, Holding } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { InvestmentsBoard } from "./investments-board";

const gold: Holding = {
  id: "g",
  label: "Gram gold",
  typeId: "gold",
  unitLabel: "g",
  currentPrice: 300_000,
  priceDate: "2026-10-01",
  trades: [{ id: "t1", date: "2026-01-10", side: "buy", quantity: 2, unitPrice: 200_000 }],
};
const stale: Holding = {
  ...gold,
  id: "s",
  label: "Old fund",
  typeId: "fund",
  priceDate: "2026-06-01",
};

function Harness({ initial = [] as Holding[], onSaved = vi.fn(), onDeleted = vi.fn() }) {
  const [holdings, setHoldings] = useState(initial);
  const [basket, setBasket] = useState<BasketEntry[]>([]);
  return (
    <InvestmentsBoard
      holdings={holdings}
      today="2026-10-15"
      currency="TRY"
      createId={(() => {
        let n = 0;
        return () => `id-${n++}`;
      })()}
      annualInflation={0.38}
      basket={basket}
      suggestedMonthly={0}
      onBasketChange={setBasket}
      onAssign={vi.fn()}
      onSave={(h) => {
        onSaved(h);
        setHoldings((prev) =>
          prev.some((p) => p.id === h.id) ? prev.map((p) => (p.id === h.id ? h : p)) : [...prev, h],
        );
      }}
      onDelete={(h) => {
        onDeleted(h);
        setHoldings((prev) => prev.filter((p) => p.id !== h.id));
      }}
      onTradeRemoved={vi.fn()}
    />
  );
}

describe("InvestmentsBoard", () => {
  it("invites the first investment and lists the types to read about", () => {
    renderWithIntl(<Harness />);
    expect(screen.getByText("Record what you invest in")).toBeInTheDocument();
    expect(screen.getByTestId("guide-gold")).toHaveTextContent("Gold");
    expect(screen.getByText(/not financial advice/i)).toBeInTheDocument();
  });

  it("shows value, cost, profit and the split by type", () => {
    renderWithIntl(<Harness initial={[gold]} />);
    // 2 g at 3,000 = 6,000 worth; paid 4,000; profit 2,000
    expect(screen.getByTestId("portfolio-value")).toHaveTextContent("₺6,000.00");
    expect(screen.getByTestId("portfolio-cost")).toHaveTextContent("₺4,000.00");
    expect(screen.getByTestId("portfolio-profit")).toHaveTextContent("+₺2,000.00");
    expect(screen.getByTestId("alloc-gold")).toHaveTextContent("Gold 100%");
    expect(screen.getByTestId("holding-profit-g")).toHaveTextContent("(+50.0%)");
  });

  it("shows a loss as a loss", () => {
    renderWithIntl(<Harness initial={[{ ...gold, currentPrice: 100_000 }]} />);
    expect(screen.getByTestId("holding-profit-g")).toHaveTextContent("−₺2,000.00");
  });

  it("warns when a price is a month old and when there is none", () => {
    renderWithIntl(
      <Harness
        initial={[stale, { ...gold, id: "n", currentPrice: undefined, priceDate: undefined }]}
      />,
    );
    expect(screen.getByTestId("holding-stale-s")).toHaveTextContent("Price is 136 days old");
    expect(screen.getByTestId("holding-noprice-n")).toBeInTheDocument();
    expect(screen.queryByTestId("holding-stale-n")).not.toBeInTheDocument();
  });

  it("adds an investment with a first purchase, using a decimal quantity", async () => {
    const onSaved = vi.fn();
    renderWithIntl(<Harness onSaved={onSaved} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Add an investment" })[0] as HTMLElement);
    const panel = await screen.findByRole("dialog", { name: "Add an investment" });
    fireEvent.click(within(panel).getByRole("radio", { name: "Shares" }));
    fireEvent.change(within(panel).getByLabelText("Name"), { target: { value: "Bank stock" } });
    fireEvent.change(within(panel).getByLabelText("How many units"), { target: { value: "0.35" } });
    fireEvent.change(within(panel).getByLabelText("Price of one unit"), {
      target: { value: "2500" },
    });
    fireEvent.click(within(panel).getByRole("button", { name: "Add" }));
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Bank stock",
        typeId: "stock",
        currentPrice: 250_000,
        trades: [expect.objectContaining({ quantity: 0.35, unitPrice: 250_000, side: "buy" })],
      }),
    );
  });

  it("lets the user make their own type", async () => {
    const onSaved = vi.fn();
    renderWithIntl(<Harness onSaved={onSaved} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Add an investment" })[0] as HTMLElement);
    const panel = await screen.findByRole("dialog");
    fireEvent.click(within(panel).getByRole("radio", { name: "Your own type" }));
    fireEvent.change(within(panel).getByLabelText("Name of your type"), {
      target: { value: "Wine" },
    });
    fireEvent.change(within(panel).getByLabelText("Name"), { target: { value: "Case of red" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Add" }));
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({ typeId: "custom", customType: "Wine", trades: [] }),
    );
    expect(await screen.findByTestId("holding-id-0")).toHaveTextContent("Wine");
  });

  it("refuses an investment without a name, and a purchase with a quantity but no price", async () => {
    const onSaved = vi.fn();
    renderWithIntl(<Harness onSaved={onSaved} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Add an investment" })[0] as HTMLElement);
    const panel = await screen.findByRole("dialog");
    fireEvent.click(within(panel).getByRole("button", { name: "Add" }));
    expect(within(panel).getByText("Enter a name.")).toBeInTheDocument();
    fireEvent.change(within(panel).getByLabelText("Name"), { target: { value: "X" } });
    fireEvent.change(within(panel).getByLabelText("How many units"), { target: { value: "2" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Add" }));
    expect(within(panel).getByText("Enter the price of one unit.")).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("records a purchase and moves the price to it", async () => {
    const onSaved = vi.fn();
    renderWithIntl(<Harness initial={[gold]} onSaved={onSaved} />);
    fireEvent.click(screen.getByRole("button", { name: /Buy or sell.*Gram gold/ }));
    const panel = await screen.findByRole("dialog", { name: "Buy or sell Gram gold" });
    fireEvent.change(within(panel).getByLabelText("How many (g)"), { target: { value: "1,5" } });
    fireEvent.change(within(panel).getByLabelText("Price of one unit"), {
      target: { value: "3100" },
    });
    fireEvent.click(within(panel).getByRole("button", { name: "Record purchase" }));
    const saved = onSaved.mock.calls[0]?.[0] as Holding;
    expect(saved.trades).toHaveLength(2);
    expect(saved.currentPrice).toBe(310_000);
    expect(screen.getByTestId("holding-quantity-g")).toHaveTextContent("3.5 g");
  });

  it("refuses to sell more than is held", async () => {
    const onSaved = vi.fn();
    renderWithIntl(<Harness initial={[gold]} onSaved={onSaved} />);
    fireEvent.click(screen.getByRole("button", { name: /Buy or sell.*Gram gold/ }));
    const panel = await screen.findByRole("dialog");
    fireEvent.click(within(panel).getByText("Sell", { selector: "label" }));
    fireEvent.change(within(panel).getByLabelText("How many (g)"), { target: { value: "2.5" } });
    fireEvent.change(within(panel).getByLabelText("Price of one unit"), {
      target: { value: "3000" },
    });
    fireEvent.click(within(panel).getByRole("button", { name: "Record sale" }));
    expect(within(panel).getByText("You hold fewer units than that.")).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("updates the price with its date", async () => {
    const onSaved = vi.fn();
    renderWithIntl(<Harness initial={[stale]} onSaved={onSaved} />);
    fireEvent.click(screen.getByRole("button", { name: /Update price.*Old fund/ }));
    const panel = await screen.findByRole("dialog");
    fireEvent.change(within(panel).getByLabelText("Price of one unit"), {
      target: { value: "3500" },
    });
    fireEvent.change(within(panel).getByLabelText("As of"), { target: { value: "2026-10-14" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Save price" }));
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({ currentPrice: 350_000, priceDate: "2026-10-14" }),
    );
    expect(screen.queryByTestId("holding-stale-s")).not.toBeInTheDocument();
  });

  it("removes a trade from the history and deletes the investment", async () => {
    const onDeleted = vi.fn();
    renderWithIntl(
      <Harness
        initial={[
          {
            ...gold,
            trades: [
              ...gold.trades,
              { id: "t2", date: "2026-02-01", side: "buy", quantity: 1, unitPrice: 250_000 },
            ],
          },
        ]}
        onDeleted={onDeleted}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /History.*Gram gold/ }));
    const panel = await screen.findByRole("dialog", { name: "History of Gram gold" });
    fireEvent.click(
      within(panel).getByRole("button", { name: "Delete the entry from 2026-02-01" }),
    );
    expect(screen.getByTestId("holding-quantity-g")).toHaveTextContent("2 g");
    fireEvent.click(within(panel).getByRole("button", { name: "Delete Gram gold" }));
    expect(onDeleted).toHaveBeenCalledWith(expect.objectContaining({ id: "g" }));
  });
});
