import { NextIntlClientProvider } from "next-intl";
import { render, screen } from "@testing-library/react";
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
});
