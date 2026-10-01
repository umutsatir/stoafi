import { NextIntlClientProvider } from "next-intl";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import en from "@/i18n/en.json";
import { Nav } from "./nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

function renderNav() {
  return render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <Nav />
    </NextIntlClientProvider>,
  );
}

describe("Nav", () => {
  it("renders a link for every route", () => {
    renderNav();

    for (const label of [
      "Home",
      "Income & Expenses",
      "Profile",
      "Plan",
      "Queue",
      "Savings",
      "Cards",
      "Health",
      "Decisions",
      "Lessons",
      "Settings",
    ]) {
      // Every page is reachable from the sidebar (desktop).
      expect(
        within(screen.getByRole("navigation", { name: "Main" })).getByRole("link", { name: label }),
      ).toBeInTheDocument();
    }
  });

  it("groups the sidebar under headings", () => {
    renderNav();
    const sidebar = within(screen.getByRole("navigation", { name: "Main" }));
    for (const heading of ["Overview", "Money", "Plan", "Status", "Learn", "You"]) {
      expect(sidebar.getAllByText(heading).length).toBeGreaterThan(0);
    }
  });

  it("gives phones a bottom bar with four tabs and a More sheet holding the rest", async () => {
    renderNav();
    const bar = within(screen.getByRole("navigation", { name: "Main, bottom bar" }));
    expect(bar.getAllByRole("link").map((l) => l.textContent)).toEqual([
      "Home",
      "Money",
      "Queue",
      "Plan",
    ]);
    fireEvent.click(bar.getByRole("button", { name: "More" }));
    const sheet = within(await screen.findByRole("dialog", { name: "More pages" }));
    for (const label of [
      "Savings",
      "Cards",
      "Health",
      "Decisions",
      "Lessons",
      "Profile",
      "Settings",
    ]) {
      expect(sheet.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the current page", () => {
    renderNav();
    const home = within(screen.getByRole("navigation", { name: "Main" })).getByRole("link", {
      name: "Home",
    });
    expect(home).toHaveAttribute("aria-current", "page");
  });
});
