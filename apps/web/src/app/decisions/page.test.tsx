import { fireEvent, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it } from "vitest";
import type { Decision, Profile } from "@stoafi/core";
import { Toaster } from "@/components/ui/toaster";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import DecisionsPage from "./page";

const profile: Profile = {
  incomes: [{ label: "Job", monthly: 17_600_00 }],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

const skipped: Decision = {
  id: "d1",
  queueItemRef: "gone",
  itemName: "Headphones",
  outcome: "skipped",
  timestamp: "2026-09-20T10:00:00.000Z",
  amount: 300_000,
};

beforeEach(async () => {
  toast.dismiss();
  await db.decisions.clear();
  await db.queue.clear();
  useAppStore.setState({
    decisions: [],
    queueItems: [],
    profile,
    today: "2026-10-01",
    hydrated: true,
  });
});

function renderPage() {
  return renderWithIntl(
    <>
      <DecisionsPage />
      <Toaster />
    </>,
  );
}

describe("Decisions screen", () => {
  it("teaches what the page is for and links to the queue when there are no decisions", () => {
    renderPage();
    expect(screen.getByText("Your shopping decisions will gather here")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to the queue" })).toHaveAttribute("href", "/queue");
  });

  it("shows the log, with the item name, once there is a decision", () => {
    useAppStore.setState({ decisions: [skipped] });
    renderPage();
    expect(screen.queryByText("Your shopping decisions will gather here")).not.toBeInTheDocument();
    expect(screen.getByText("Headphones")).toBeInTheDocument();
  });

  it("shows the saving as work days from the profile's hourly income", () => {
    useAppStore.setState({ decisions: [skipped] });
    renderPage();
    expect(screen.getByText(/work days of your time/)).toBeInTheDocument();
  });

  it("adds a skipped item back to the queue and saves it", async () => {
    useAppStore.setState({ decisions: [skipped] });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Add Headphones back to the queue" }));
    const [item] = useAppStore.getState().queueItems;
    expect(item).toMatchObject({
      name: "Headphones",
      price: 300_000,
      addedDate: "2026-10-01",
      order: 0,
    });
    await waitFor(async () => expect(await db.queue.count()).toBe(1));
    expect(await screen.findByText("Headphones is back in your queue")).toBeInTheDocument();
  });

  it("deletes a decision from the screen and storage, and undo brings it back", async () => {
    await db.decisions.put(skipped);
    useAppStore.setState({ decisions: [skipped] });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Delete decision Headphones" }));
    expect(useAppStore.getState().decisions).toEqual([]);
    await waitFor(async () => expect(await db.decisions.count()).toBe(0));

    fireEvent.click(await screen.findByRole("button", { name: "Undo" }));
    expect(useAppStore.getState().decisions).toEqual([skipped]);
    await waitFor(async () => expect(await db.decisions.count()).toBe(1));
  });
});

describe("deleting a purchase bought in installments", () => {
  const phone = {
    id: "phone",
    name: "Phone",
    price: 100_000,
    urgency: 2,
    importance: 2,
    isNeed: false,
    expectedUses: 10,
    addedDate: "2026-01-01",
    priceUpdatedDate: "2026-01-01",
    order: 0,
    installmentPurchase: {
      offer: { months: 2, payments: [50_000, 50_000] },
      firstMonth: "2026-10" as const,
    },
  };
  const bought: Decision = {
    id: "b1",
    queueItemRef: "phone",
    itemName: "Phone",
    outcome: "bought",
    timestamp: "2026-09-30T10:00:00.000Z",
    amount: 100_000,
  };

  beforeEach(async () => {
    await db.queue.put(phone);
    await db.decisions.put(bought);
    useAppStore.setState({ decisions: [bought], queueItems: [phone] });
  });

  it("removes its installments too, so they stop counting, and says so", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Delete decision Phone" }));
    expect(useAppStore.getState().decisions).toEqual([]);
    expect(useAppStore.getState().queueItems).toEqual([]);
    await waitFor(async () => expect(await db.queue.count()).toBe(0));
    expect(await screen.findByText("Removed “Phone” and its installments")).toBeInTheDocument();
  });

  it("brings both back with undo", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Delete decision Phone" }));
    fireEvent.click(await screen.findByRole("button", { name: "Undo" }));
    expect(useAppStore.getState().decisions).toHaveLength(1);
    expect(useAppStore.getState().queueItems.map((i) => i.id)).toEqual(["phone"]);
    await waitFor(async () => expect(await db.queue.count()).toBe(1));
  });

  it("leaves the queue alone when a skipped decision is deleted", () => {
    const skippedPhone: Decision = { ...bought, id: "s1", outcome: "skipped" };
    useAppStore.setState({ decisions: [skippedPhone] });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Delete decision Phone" }));
    expect(useAppStore.getState().decisions).toEqual([]);
    expect(useAppStore.getState().queueItems.map((i) => i.id)).toEqual(["phone"]);
  });
});
