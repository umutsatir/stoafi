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
