import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it } from "vitest";
import type { Profile, SinkingFund } from "@stoafi/core";
import { Toaster } from "@/components/ui/toaster";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import SavingsPage from "./page";

const profile: Profile = {
  incomes: [{ label: "Job", monthly: 6_000_000 }],
  fixedExpenses: [{ label: "Rent", monthly: 1_800_000, bucket: "needs" }],
  livingExpenses: 1_200_000,
  savings: 900_000,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

const fund: SinkingFund = {
  id: "insurance",
  label: "Car insurance",
  target: 600_000,
  dueMonth: "2027-04",
  currentBalance: 0,
};

beforeEach(async () => {
  toast.dismiss();
  await db.sinkingFunds.clear();
  await db.profile.clear();
  useAppStore.setState({
    profile,
    planState: { strategyId: "fifty-thirty-twenty", params: {} },
    sinkingFunds: [],
    queueItems: [],
    today: "2026-10-15",
    hydrated: true,
  });
});

function renderPage() {
  return renderWithIntl(
    <>
      <SavingsPage />
      <Toaster />
    </>,
  );
}

describe("Savings screen", () => {
  it("asks for income and expenses first when there is no profile", () => {
    useAppStore.setState({ profile: null });
    renderPage();
    expect(screen.getByRole("link", { name: "Add income and expenses" })).toBeInTheDocument();
  });

  it("always shows the emergency fund as the first pot, with the saved balance", () => {
    renderPage();
    expect(screen.getByTestId("pot-balance-emergency")).toHaveTextContent("₺9,000.00");
  });

  it("shows what is left, what to set aside and what stays free this month", () => {
    renderPage();
    expect(screen.getByTestId("summary-left")).toBeInTheDocument();
    expect(screen.getByTestId("savings-sentence")).toHaveTextContent(/set aside/);
  });

  it("adds a pot from the panel, saves it and confirms with a toast", async () => {
    renderPage();
    fireEvent.click(screen.getAllByRole("button", { name: "Add a pot" })[0] as HTMLElement);
    const panel = await screen.findByRole("dialog", { name: "Add a pot" });
    fireEvent.change(within(panel).getByLabelText("Name"), { target: { value: "Tax" } });
    fireEvent.change(within(panel).getByLabelText("Target amount"), { target: { value: "1200" } });
    fireEvent.change(within(panel).getByLabelText("Due month"), { target: { value: "2027-04" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Add" }));

    expect(useAppStore.getState().sinkingFunds[0]).toMatchObject({ label: "Tax", target: 120_000 });
    await waitFor(async () => expect(await db.sinkingFunds.count()).toBe(1));
    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });

  it("puts money into a pot: balance, history and storage all follow", async () => {
    await db.sinkingFunds.put(fund);
    useAppStore.setState({ sinkingFunds: [fund] });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Add money.*Car insurance/ }));
    const panel = await screen.findByRole("dialog", { name: "Add to Car insurance" });
    fireEvent.change(within(panel).getByLabelText("Amount"), { target: { value: "1500" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Put in" }));

    const saved = useAppStore.getState().sinkingFunds[0];
    expect(saved?.currentBalance).toBe(150_000);
    expect(saved?.deposits).toEqual([expect.objectContaining({ amount: 150_000 })]);
    await waitFor(async () => {
      const row = (await db.sinkingFunds.get("insurance")) as SinkingFund | undefined;
      expect(row?.currentBalance).toBe(150_000);
    });
    expect(
      await screen.findByText("A quarter of Car insurance is in. Good start!"),
    ).toBeInTheDocument();
  });

  it("puts money into the emergency fund and keeps the profile's savings in step", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Add money.*Emergency fund/ }));
    const panel = await screen.findByRole("dialog", { name: "Add to Emergency fund" });
    fireEvent.change(within(panel).getByLabelText("Amount"), { target: { value: "1000" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Put in" }));

    expect(useAppStore.getState().profile?.savings).toBe(1_000_000);
    await waitFor(async () => {
      const row = (await db.profile.get("singleton")) as { data: Profile } | undefined;
      expect(row?.data.savings).toBe(1_000_000);
      expect(row?.data.deposits).toHaveLength(1);
    });
  });

  it("refuses to take out more than the pot holds", async () => {
    await db.sinkingFunds.put({ ...fund, currentBalance: 10_000 });
    useAppStore.setState({ sinkingFunds: [{ ...fund, currentBalance: 10_000 }] });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Add money.*Car insurance/ }));
    const panel = await screen.findByRole("dialog");
    fireEvent.click(within(panel).getByText("Take out", { selector: "label" }));
    fireEvent.change(within(panel).getByLabelText("Amount"), { target: { value: "500" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Take out" }));
    expect(within(panel).getByText("There is less than that in this pot.")).toBeInTheDocument();
    expect(useAppStore.getState().sinkingFunds[0]?.currentBalance).toBe(10_000);
  });

  it("cheers a smaller deposit with what the month adds up to", async () => {
    await db.sinkingFunds.put(fund);
    useAppStore.setState({ sinkingFunds: [fund] });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Add money.*Car insurance/ }));
    const panel = await screen.findByRole("dialog", { name: "Add to Car insurance" });
    fireEvent.change(within(panel).getByLabelText("Amount"), { target: { value: "100" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Put in" }));
    expect(
      await screen.findByText(/added to Car insurance\. You have put .* aside this month/),
    ).toBeInTheDocument();
  });

  it("puts money into a pot that has no goal and says what it now holds", async () => {
    const open: SinkingFund = { id: "open", label: "Rainy day", target: 0, currentBalance: 0 };
    await db.sinkingFunds.put(open);
    useAppStore.setState({ sinkingFunds: [open] });
    renderPage();
    expect(screen.getByText("No goal or deadline: put in what you like")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Add money.*Rainy day/ }));
    const panel = await screen.findByRole("dialog", { name: "Add to Rainy day" });
    fireEvent.change(within(panel).getByLabelText("Amount"), { target: { value: "250" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Put in" }));
    expect(useAppStore.getState().sinkingFunds[0]?.currentBalance).toBe(25_000);
    expect(await screen.findByText(/added to Rainy day\. It now holds/)).toBeInTheDocument();
  });

  it("lists the history and removes an entry with an undo", async () => {
    const withMoney: SinkingFund = {
      ...fund,
      currentBalance: 200_000,
      deposits: [{ id: "x", date: "2026-10-02", amount: 200_000 }],
    };
    await db.sinkingFunds.put(withMoney);
    useAppStore.setState({ sinkingFunds: [withMoney] });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /History.*Car insurance/ }));
    const panel = await screen.findByRole("dialog", { name: "History of Car insurance" });
    fireEvent.click(
      within(panel).getByRole("button", { name: "Delete the entry from 2026-10-02" }),
    );

    expect(useAppStore.getState().sinkingFunds[0]).toMatchObject({
      currentBalance: 0,
      deposits: [],
    });
    fireEvent.click(await screen.findByRole("button", { name: "Undo" }));
    expect(useAppStore.getState().sinkingFunds[0]?.currentBalance).toBe(200_000);
  });

  it("shows a pot as reached once it is full", () => {
    useAppStore.setState({ sinkingFunds: [{ ...fund, currentBalance: 600_000 }] });
    renderPage();
    expect(screen.getByTestId("pot-state-insurance")).toHaveTextContent("Reached");
  });

  it("does not throw for a pot that is due this month", () => {
    useAppStore.setState({ sinkingFunds: [{ ...fund, dueMonth: "2026-10" }] });
    renderPage();
    expect(screen.getByTestId("pot-state-insurance")).toHaveTextContent("Due now");
  });

  it("deletes a pot with an undo that brings it back, saved again", async () => {
    await db.sinkingFunds.put(fund);
    useAppStore.setState({ sinkingFunds: [fund] });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /History.*Car insurance/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete Car insurance" }));
    expect(useAppStore.getState().sinkingFunds).toEqual([]);
    await waitFor(async () => expect(await db.sinkingFunds.count()).toBe(0));
    fireEvent.click(await screen.findByRole("button", { name: "Undo" }));
    expect(useAppStore.getState().sinkingFunds).toEqual([fund]);
    await waitFor(async () => expect(await db.sinkingFunds.count()).toBe(1));
  });

  it("links to the sinking funds lesson", () => {
    renderPage();
    expect(screen.getByTestId("lesson-link-sinking-funds")).toHaveAttribute(
      "href",
      "/lessons#sinking-funds",
    );
  });
});
