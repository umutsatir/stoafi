import { NextIntlClientProvider } from "next-intl";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import en from "@/i18n/en.json";
import tr from "@/i18n/tr.json";
import type { Locale } from "@/i18n/messages";

const messagesByLocale = { en, tr };

/** Renders a component wrapped in NextIntlClientProvider, for components using useTranslations. */
export function renderWithIntl(
  ui: ReactElement,
  locale: Locale = "en",
  options?: RenderOptions,
): RenderResult {
  return render(
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]} timeZone="UTC">
      {ui}
    </NextIntlClientProvider>,
    options,
  );
}
