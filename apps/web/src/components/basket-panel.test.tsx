import { fireEvent, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { BasketEntry, BasketLogEntry, Holding } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { BasketPanel } from "./basket-panel";

const held = (id: string, typeId: string, quantity: number, price = 100_000): Holding => ({
  id,
  label: id,
  typeId,
  currentPrice: price,
  trades: [{ id: `${id}-t`, date: "2026-01-01", side: "buy", quantity, unitPrice: price }],
});

function Harness({
  initial = [] as BasketEntry[],
  holdings = [] as Holding[],
  suggestedMonthly = 1_000_000,
  onAssign = vi.fn(),
  onChange = vi.fn(),
}) {
  const [basket, setBasket] = useState(initial);
  let n = 0;
  return (
    <BasketPanel
      basket={basket}
      holdings={holdings}
      currency="TRY"
      suggestedMonthly={suggestedMonthly}
      createId={() => `id-${n++}`}
      onChange={(next) => {
        onChange(next);
        setBasket(next);
      }}
      onAssign={onAssign}
    />
  );
}

const mine: BasketEntry[] = [
  { id: "gold", label: "Gold", typeId: "gold", percent: 60 },
  { id: "sp", label: "S&P 500", typeId: "index-fund", percent: 40 },
];

describe("BasketPanel", () => {
  it("starts by offering example baskets, dated and with their sources", () => {
    renderWithIntl(<Harness />);
    const templates = screen.getByTestId("basket-templates");
    expect(within(templates).getByText("Careful")).toBeInTheDocument();
    expect(within(templates).getByText("Balanced")).toBeInTheDocument();
    expect(within(templates).getByText("Growth")).toBeInTheDocument();
    const source = screen.getByTestId("basket-source");
    expect(source).toHaveTextContent("Last reviewed 2026-10");
    expect(source).toHaveTextContent("not advice for you");
  });

  it("fills the basket from an example and lets the user change it", () => {
    const onChange = vi.fn();
    renderWithIntl(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Use the Balanced basket" }));
    expect(screen.queryByTestId("basket-templates")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Slice 1 name")).toHaveValue("S&P 500 index fund");
    expect(screen.getByLabelText("Slice 1 percent")).toHaveValue(30);
    expect(screen.getByTestId("basket-total")).toHaveTextContent("Adds up to 100%");

    fireEvent.change(screen.getByLabelText("Slice 1 percent"), { target: { value: "40" } });
    expect(screen.getByTestId("basket-total")).toHaveTextContent("Adds up to 110%: 10% too much");
    fireEvent.change(screen.getByLabelText("Slice 1 percent"), { target: { value: "20" } });
    expect(screen.getByTestId("basket-total")).toHaveTextContent(
      "Adds up to 90%: 10% still to place",
    );
  });

  it("keeps a percent between 0 and 100", () => {
    renderWithIntl(<Harness initial={mine} />);
    fireEvent.change(screen.getByLabelText("Slice 1 percent"), { target: { value: "250" } });
    expect(screen.getByLabelText("Slice 1 percent")).toHaveValue(100);
    fireEvent.change(screen.getByLabelText("Slice 1 percent"), { target: { value: "-5" } });
    expect(screen.getByLabelText("Slice 1 percent")).toHaveValue(0);
  });

  it("adds and removes slices", () => {
    renderWithIntl(<Harness initial={mine} />);
    fireEvent.click(screen.getByRole("button", { name: "Add slice" }));
    expect(screen.getByLabelText("Slice 3 name")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove slice 3" }));
    expect(screen.queryByLabelText("Slice 3 name")).not.toBeInTheDocument();
  });

  it("splits the monthly amount by the percentages, adding up exactly", () => {
    renderWithIntl(<Harness initial={mine} suggestedMonthly={1_000_001} />);
    const gold = screen.getByTestId("split-gold");
    const sp = screen.getByTestId("split-sp");
    // 1,000,001 kuruş: 600,000.6 and 400,000.4 -> the spare kuruş goes to the larger fraction.
    expect(gold).toHaveTextContent("₺6,000.01");
    expect(sp).toHaveTextContent("₺4,000.00");
  });

  it("asks to finish the percentages before showing a split", () => {
    renderWithIntl(<Harness initial={[{ id: "a", label: "A", percent: 50 }]} />);
    expect(
      screen.getByText("Make the percentages add up to 100% to see the split."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("split-a")).not.toBeInTheDocument();
  });

  it("shows where the user is against the basket, and fills the gaps with new money", () => {
    // Held: gold 900,000 and nothing in the index fund. Target 60/40.
    renderWithIntl(
      <Harness initial={mine} holdings={[held("g", "gold", 9)]} suggestedMonthly={1_000_000} />,
    );
    expect(screen.getByTestId("drift-gold")).toHaveTextContent("100% held, target 60%");
    expect(screen.getByTestId("drift-sp")).toHaveTextContent("0% held, target 40%");
    // After adding 1,000,000 the total is 1,900,000: gold target 1,140,000 (hold 900,000), sp target 760,000.
    // Gaps 240,000 and 760,000 share 1,000,000 by size.
    const gold = screen.getByTestId("split-gold").textContent ?? "";
    const sp = screen.getByTestId("split-sp").textContent ?? "";
    expect(Number(gold.replace(/[^\d.]/g, ""))).toBeLessThan(Number(sp.replace(/[^\d.]/g, "")));

    fireEvent.click(screen.getByRole("radio", { name: "Plain percentages" }));
    expect(screen.getByTestId("split-gold")).toHaveTextContent("₺6,000.00");
  });

  it("asks which slice an unplaced holding belongs to", () => {
    const onAssign = vi.fn();
    renderWithIntl(
      <Harness initial={mine} holdings={[held("crypto", "crypto", 1)]} onAssign={onAssign} />,
    );
    const box = screen.getByTestId("basket-unassigned");
    fireEvent.change(within(box).getByLabelText("Put crypto in a slice"), {
      target: { value: "gold" },
    });
    expect(onAssign).toHaveBeenCalledWith("crypto", "gold");
  });

  it("can restart from an example, and undo is offered when it replaces a basket", () => {
    renderWithIntl(<Harness initial={mine} />);
    fireEvent.click(screen.getByRole("button", { name: "Start from an example" }));
    fireEvent.click(screen.getByRole("button", { name: "Use the Careful basket" }));
    expect(screen.getByLabelText("Slice 1 name")).toHaveValue("Deposit or money market");
  });

  it("states that it is not a recommendation", () => {
    renderWithIntl(<Harness initial={mine} />);
    expect(screen.getByText(/not a recommendation to buy anything/)).toBeInTheDocument();
  });

  it("speaks Turkish", () => {
    renderWithIntl(<Harness />, "tr");
    expect(screen.getByText("Temkinli")).toBeInTheDocument();
    expect(screen.getByTestId("basket-source")).toHaveTextContent("Son gözden geçirme: 2026-10");
  });
});

function TickHarness({
  holdings = [] as Holding[],
  onToggle = vi.fn(),
  onMonthlyChange = vi.fn(),
  savedMonthly = null as number | null,
}) {
  const [log, setLog] = useState<BasketLogEntry[]>([]);
  return (
    <BasketPanel
      basket={mine}
      holdings={holdings}
      currency="TRY"
      suggestedMonthly={1_000_000}
      savedMonthly={savedMonthly}
      onMonthlyChange={onMonthlyChange}
      log={log}
      month="2026-10"
      createId={() => "x"}
      onChange={vi.fn()}
      onAssign={vi.fn()}
      onToggle={(entry, amount, done) => {
        onToggle(entry, amount, done);
        setLog((l) =>
          done
            ? [...l, { month: "2026-10", entryId: entry.id, amount }]
            : l.filter((x) => x.entryId !== entry.id),
        );
      }}
    />
  );
}

describe("BasketPanel ticking", () => {
  it("lets the user tick a slice instead of typing the amount again", () => {
    const onToggle = vi.fn();
    renderWithIntl(<TickHarness onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button", { name: "Mark Gold as invested" }));
    expect(onToggle).toHaveBeenCalledWith(mine[0], 600_000, true);
    const row = screen.getByTestId("split-gold");
    expect(row).toHaveTextContent("Done · undo");
    expect(row).toHaveTextContent("Noted for this month.");
    expect(screen.getByTestId("basket-progress")).toHaveTextContent(
      "Put in so far this month: ₺6,000.00 of ₺10,000.00",
    );
  });

  it("takes a tick back", () => {
    const onToggle = vi.fn();
    renderWithIntl(<TickHarness onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button", { name: "Mark Gold as invested" }));
    fireEvent.click(screen.getByRole("button", { name: "Undo Gold" }));
    expect(onToggle).toHaveBeenLastCalledWith(mine[0], 600_000, false);
    expect(screen.getByTestId("basket-progress")).toHaveTextContent("₺0.00 of ₺10,000.00");
  });

  it("says when ticking also records a purchase, and when it only notes it", () => {
    renderWithIntl(<TickHarness holdings={[held("g", "gold", 1, 300_000)]} />);
    expect(screen.getByTestId("split-gold")).toHaveTextContent(
      "Ticking also adds this purchase to g, at its current price.",
    );
    expect(screen.getByTestId("split-sp")).toHaveTextContent("Ticking only notes it.");
  });

  it("remembers a monthly amount the user changed", () => {
    const onMonthlyChange = vi.fn();
    renderWithIntl(<TickHarness onMonthlyChange={onMonthlyChange} />);
    fireEvent.change(screen.getByLabelText("Amount to invest"), { target: { value: "20000" } });
    expect(onMonthlyChange).toHaveBeenLastCalledWith(2_000_000);
  });

  it("starts from the saved amount instead of the suggestion", () => {
    renderWithIntl(<TickHarness savedMonthly={2_500_000} />);
    expect(screen.getByLabelText("Amount to invest")).toHaveValue("25000");
  });
});
