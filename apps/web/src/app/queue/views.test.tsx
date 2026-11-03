import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Profile, QueueItem } from "@stoafi/core";
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

function item(overrides: Partial<QueueItem>): QueueItem {
  return {
    id: "x",
    name: "X",
    price: 300_000,
    urgency: 2,
    importance: 2,
    isNeed: false,
    expectedUses: 100,
    addedDate: "2020-01-01",
    priceUpdatedDate: "2020-01-01",
    order: 0,
    ...overrides,
  };
}

const headphones = item({ id: "h", name: "Headphones", urgency: 1, importance: 3, order: 0 });
const rent = item({ id: "r", name: "Fridge", isNeed: true, urgency: 3, importance: 3, order: 1 });
const yacht = item({ id: "y", name: "Yacht", price: 900_000_000, order: 2 });

/** The page opens on the timeline; most tests work with the list. */
function renderPage(view: "List" | "Eisenhower" | null = "List") {
  const result = renderWithIntl(<QueuePage />);
  if (view) fireEvent.click(screen.getByRole("radio", { name: view }));
  return result;
}

beforeEach(async () => {
  await db.queue.clear();
  useAppStore.setState({
    profile,
    planState: { strategyId: "fifty-thirty-twenty", params: {} },
    queueItems: [headphones, rent, yacht],
    decisions: [],
    cards: [],
    guardThresholds: { installmentCapPct: 0.2 },
    today: "2026-09-15",
    hydrated: true,
  });
});

describe("Queue page layout", () => {
  it("shows an empty state with an add button when nothing is waiting", async () => {
    useAppStore.setState({ queueItems: [] });
    renderPage(null);
    expect(screen.getByText("Your queue is empty")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Add item" })[1] as HTMLElement);
    expect(await screen.findByRole("dialog", { name: "Add to queue" })).toBeInTheDocument();
  });

  it("keeps the add form out of the page until asked", () => {
    renderPage();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Price")).not.toBeInTheDocument();
  });

  it("summarises the total waiting, how many items fit this month and the nearest one", () => {
    renderPage();
    // 3,000 + 3,000 + 9,000,000 of cash price
    expect(screen.getByTestId("summary-total")).toHaveTextContent("₺9,006,000.00");
    expect(screen.getByTestId("summary-fits")).toHaveTextContent("2 items");
    expect(screen.getByTestId("summary-nearest")).not.toHaveTextContent("Nothing fits yet");
  });

  it("shows the selected item's detail under the list instead of in a panel", () => {
    renderPage();
    // The first item is open straight away.
    expect(screen.getByRole("heading", { name: "Headphones" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(
      within(screen.getByTestId("queue-item-r")).getByRole("button", { name: "Fridge" }),
    );
    expect(screen.getByRole("heading", { name: "Fridge" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("edits an item in the panel", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Edit Headphones" }));
    const panel = await screen.findByRole("dialog", { name: "Edit item" });
    expect(within(panel).getByLabelText("Name")).toHaveValue("Headphones");
    fireEvent.change(within(panel).getByLabelText("Name"), { target: { value: "Earbuds" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Save changes" }));
    expect(useAppStore.getState().queueItems.find((i) => i.id === "h")?.name).toBe("Earbuds");
  });
});

describe("Queue views and filters", () => {
  it("opens on the timeline and switches between timeline, list and Eisenhower", () => {
    renderPage(null);
    expect(screen.getByText("12-month timeline")).toBeInTheDocument();
    expect(screen.queryByTestId("queue-item-h")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "List" }));
    expect(screen.getByTestId("queue-item-h")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Eisenhower" }));
    expect(screen.queryByTestId("queue-item-h")).not.toBeInTheDocument();
    // urgency 1 / importance 3: important, not urgent
    expect(within(screen.getByTestId("quadrant-plan")).getByText("Headphones")).toBeInTheDocument();
    // urgency 3 / importance 3: urgent and important
    expect(within(screen.getByTestId("quadrant-doNow")).getByText("Fridge")).toBeInTheDocument();
  });

  it("picks an item from a bubble on the timeline", () => {
    renderPage(null);
    fireEvent.click(screen.getByRole("button", { name: "Fridge" }));
    expect(screen.getByRole("heading", { name: "Fridge" })).toBeInTheDocument();
  });

  it("filters to needs or wants and hides reordering while filtered", () => {
    renderPage();
    expect(screen.getByLabelText("Drag Headphones to reorder")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Needs" }));
    expect(screen.getByTestId("queue-item-r")).toBeInTheDocument();
    expect(screen.queryByTestId("queue-item-h")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Drag Fridge to reorder")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Wants" }));
    expect(screen.getByTestId("queue-item-h")).toBeInTheDocument();
    expect(screen.queryByTestId("queue-item-r")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "All" }));
    expect(screen.getByLabelText("Drag Headphones to reorder")).toBeInTheDocument();
  });

  it("describes priority in words on each row", () => {
    renderPage();
    expect(
      within(screen.getByTestId("queue-item-r")).getByText("Urgent and important"),
    ).toBeInTheDocument();
    expect(within(screen.getByTestId("queue-item-h")).getByText("Important")).toBeInTheDocument();
  });
});

describe("Queue price age", () => {
  it("asks whether an old price is still right, and opens the item to fix it", async () => {
    useAppStore.setState({
      queueItems: [
        { ...headphones, priceUpdatedDate: "2026-05-01", addedDate: "2026-05-01" },
        { ...rent, priceUpdatedDate: "2026-09-10" },
      ],
    });
    renderPage();
    const chip = screen.getByTestId("stale-h");
    expect(chip).toHaveTextContent("Price is 137 days old: still right?");
    expect(screen.queryByTestId("stale-r")).not.toBeInTheDocument();
    fireEvent.click(chip);
    const panel = await screen.findByRole("dialog", { name: "Edit item" });
    expect(within(panel).getByLabelText("Name")).toHaveValue("Headphones");
  });

  it("does not nag about a price that is only a little old", () => {
    useAppStore.setState({
      queueItems: [{ ...headphones, priceUpdatedDate: "2026-08-20", addedDate: "2026-08-20" }],
    });
    renderPage();
    expect(screen.queryByTestId("stale-h")).not.toBeInTheDocument();
  });
});

describe("Queue quick action", () => {
  it("opens the add panel when the command palette asked for it, once", async () => {
    useAppStore.setState({ quickAction: "addQueueItem" });
    renderPage(null);
    expect(await screen.findByRole("dialog", { name: "Add to queue" })).toBeInTheDocument();
    expect(useAppStore.getState().quickAction).toBeNull();
  });
});
