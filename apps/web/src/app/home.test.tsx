import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import Home from "./page";

beforeEach(async () => {
  for (const table of [
    db.profile,
    db.plan,
    db.queue,
    db.sinkingFunds,
    db.cards,
    db.decisions,
    db.holdings,
  ]) {
    await table.clear();
  }
  useAppStore.setState({
    profile: null,
    queueItems: [],
    sinkingFunds: [],
    cards: [],
    decisions: [],
    holdings: [],
    demo: false,
    lastBackup: null,
    today: "2026-10-15",
    hydrated: true,
  });
});

describe("Home first run and demo", () => {
  it("shows the welcome with the wizard when nothing is set up", () => {
    renderWithIntl(<Home />);
    expect(screen.getByTestId("onboarding-welcome")).toBeInTheDocument();
    expect(screen.queryByTestId("demo-banner")).not.toBeInTheDocument();
  });

  it("loads sample data in one click, saved and shown with a banner", async () => {
    renderWithIntl(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Look around with sample data" }));
    await waitFor(() => expect(useAppStore.getState().profile).not.toBeNull());
    expect(useAppStore.getState().demo).toBe(true);
    expect(useAppStore.getState().queueItems.length).toBeGreaterThan(0);
    expect(await screen.findByTestId("demo-banner")).toHaveTextContent("sample data");
    expect(await db.queue.count()).toBeGreaterThan(0);
    expect(screen.getByTestId("left")).toBeInTheDocument();
  });

  it("clears the sample data in one click and returns to the welcome", async () => {
    renderWithIntl(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Look around with sample data" }));
    fireEvent.click(await screen.findByRole("button", { name: "Start with my own data" }));
    await waitFor(() => expect(useAppStore.getState().profile).toBeNull());
    expect(useAppStore.getState().demo).toBe(false);
    expect(await db.profile.count()).toBe(0);
    expect(await db.queue.count()).toBe(0);
    expect(await screen.findByTestId("onboarding-welcome")).toBeInTheDocument();
  });
});

describe("Home backup nudge", () => {
  const profile = {
    incomes: [{ label: "Job", monthly: 10_000_000 }],
    fixedExpenses: [],
    livingExpenses: 0,
    savings: 0,
    emergencyFundTargetMonths: 1,
    annualInflationExpectation: 0.3,
  };

  it("asks for a backup when the last one is over a month old", () => {
    useAppStore.setState({ profile, lastBackup: "2026-08-01" });
    renderWithIntl(<Home />);
    expect(screen.getByTestId("backup-nudge")).toHaveTextContent("backup");
    expect(screen.getByRole("link", { name: "Back up now" })).toHaveAttribute("href", "/settings");
  });

  it("stays quiet after a recent backup, with nothing saved, or in the sample", () => {
    useAppStore.setState({ profile, lastBackup: "2026-10-10" });
    const { unmount } = renderWithIntl(<Home />);
    expect(screen.queryByTestId("backup-nudge")).not.toBeInTheDocument();
    unmount();

    useAppStore.setState({ profile: null, lastBackup: null });
    const second = renderWithIntl(<Home />);
    expect(screen.queryByTestId("backup-nudge")).not.toBeInTheDocument();
    second.unmount();

    useAppStore.setState({ profile, lastBackup: "2026-01-01", demo: true });
    renderWithIntl(<Home />);
    expect(screen.queryByTestId("backup-nudge")).not.toBeInTheDocument();
  });
});

describe("Home details choice", () => {
  const profile = {
    incomes: [{ label: "Job", monthly: 10_000_000 }],
    fixedExpenses: [],
    livingExpenses: 0,
    savings: 0,
    emergencyFundTargetMonths: 6,
    annualInflationExpectation: 0.3,
  };

  it("starts with the details hidden, and remembers when the user shows them", () => {
    useAppStore.setState({ profile, lastBackup: null, homeDetails: false });
    renderWithIntl(<Home />);
    expect(document.getElementById("home-details")).toHaveAttribute("hidden");
    fireEvent.click(screen.getByRole("button", { name: "Show details" }));
    expect(useAppStore.getState().homeDetails).toBe(true);
    expect(document.getElementById("home-details")).not.toHaveAttribute("hidden");
  });
});
