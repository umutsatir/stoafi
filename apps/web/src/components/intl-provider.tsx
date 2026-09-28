"use client";

import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { messagesByLocale } from "@/i18n/messages";
import { useAppStore } from "@/store";

export function IntlProvider({ children }: { children: ReactNode }) {
  const locale = useAppStore((s) => s.locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
}
