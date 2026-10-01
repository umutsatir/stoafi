import { fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Profile, QueueItem } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { QueueList, type QueueListProps } from "./queue-list";

const profile: Profile = {
  incomes: [{ label: "Salary", monthly: 10000 }],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

const planState = { strategyId: "fifty-thirty-twenty", params: {} };

function item(id: string, order: number): QueueItem {
  return {
    id,
    name: id,
    price: 2000,
    urgency: 2,
    importance: 2,
    isNeed: false,
    expectedUses: 10,
    addedDate: "2025-01-01",
    priceUpdatedDate: "2025-01-01",
    order,
  };
}

/** QueueList is controlled; this keeps items in state like the page does. */
function Harness(
  props: Omit<QueueListProps, "onItemsChange"> & {
    onItemsChange?: QueueListProps["onItemsChange"];
  },
) {
  const [items, setItems] = useState(props.items);
  return (
    <QueueList
      {...props}
      items={items}
      onItemsChange={(next) => {
        setItems(next);
        props.onItemsChange?.(next);
      }}
    />
  );
}

describe("QueueList", () => {
  it("reordering via the move buttons re-runs the scheduler and updates displayed months", () => {
    const items = [item("first", 0), item("second", 1)];
    renderWithIntl(
      <Harness
        items={items}
        profile={profile}
        planState={planState}
        today="2026-01-01"
        startMonth="2026-01"
        hourlyNetIncome={200}
      />,
    );

    const firstMonthBefore = screen.getByTestId("month-first").textContent;
    const secondMonthBefore = screen.getByTestId("month-second").textContent;

    fireEvent.click(screen.getByLabelText("Move first down"));

    const firstMonthAfter = screen.getByTestId("month-first").textContent;
    const secondMonthAfter = screen.getByTestId("month-second").textContent;

    expect([firstMonthAfter, secondMonthAfter]).not.toEqual([firstMonthBefore, secondMonthBefore]);
  });

  it("reports the reordered items with renumbered order so they can be saved", () => {
    const onItemsChange = vi.fn();
    renderWithIntl(
      <Harness
        items={[item("first", 0), item("second", 1)]}
        profile={profile}
        planState={planState}
        today="2026-01-01"
        startMonth="2026-01"
        hourlyNetIncome={200}
        onItemsChange={onItemsChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("Move first down"));
    const next = onItemsChange.mock.calls[0]?.[0] as QueueItem[];
    expect(next.map((i) => [i.id, i.order])).toEqual([
      ["second", 0],
      ["first", 1],
    ]);
  });

  it("offers select, edit and delete for each item when handlers are given", () => {
    const onSelect = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderWithIntl(
      <QueueList
        items={[item("first", 0)]}
        profile={profile}
        planState={planState}
        today="2026-01-01"
        startMonth="2026-01"
        hourlyNetIncome={200}
        onItemsChange={vi.fn()}
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "first" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit first" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete first" }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "first" }));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "first" }));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "first" }));
  });
});
