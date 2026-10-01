import { NextIntlClientProvider } from "next-intl";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import en from "@/i18n/en.json";
import tr from "@/i18n/tr.json";
import { useAppStore } from "@/store";
import { LocaleSwitcher } from "./locale-switcher";

function renderWithLocale(locale: "en" | "tr") {
  const messages = locale === "en" ? en : tr;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <LocaleSwitcher />
    </NextIntlClientProvider>,
  );
}

describe("LocaleSwitcher", () => {
  beforeEach(() => {
    useAppStore.setState({ locale: "en", currency: "TRY" });
  });

  it("changes rendered date and currency formatting when the locale changes", () => {
    const { unmount } = renderWithLocale("en");
    const enAmount = screen.getByTestId("sample-amount").textContent;
    const enDate = screen.getByTestId("sample-date").textContent;
    unmount();

    renderWithLocale("tr");
    const trAmount = screen.getByTestId("sample-amount").textContent;
    const trDate = screen.getByTestId("sample-date").textContent;

    expect(trAmount).not.toBe(enAmount);
    expect(trDate).not.toBe(enDate);
  });

  it("lists languages by name and formats the sample amount with the currency symbol", () => {
    renderWithLocale("en");
    expect(screen.getByRole("option", { name: "Türkçe" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByTestId("sample-amount")).toHaveTextContent("₺123,456.78");
    expect(screen.getByTestId("sample-amount")).not.toHaveTextContent("TRY");
  });

  it("changes the saved appearance with the selector", () => {
    useAppStore.setState({ theme: "system" });
    renderWithLocale("en");
    fireEvent.change(screen.getByLabelText("Appearance"), { target: { value: "dark" } });
    expect(useAppStore.getState().theme).toBe("dark");
    expect(screen.getByRole("option", { name: "Follow my device" })).toBeInTheDocument();
  });
});
