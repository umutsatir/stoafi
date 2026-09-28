import { NextIntlClientProvider } from "next-intl";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import en from "@/i18n/en.json";
import { Nav } from "./nav";

describe("Nav", () => {
  it("renders a link for every route", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
        <Nav />
      </NextIntlClientProvider>,
    );

    for (const label of [
      "Home",
      "Profile",
      "Plan",
      "Queue",
      "Cards",
      "Health",
      "Decisions",
      "Settings",
    ]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });
});
