"use client";

import { useFormatter, useTranslations } from "next-intl";
import { LOCALES, type Locale } from "@/i18n/messages";
import { useAppStore } from "@/store";

export function LocaleSwitcher() {
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const currency = useAppStore((s) => s.currency);
  const t = useTranslations("settings");
  const format = useFormatter();

  const sampleAmount = 123456.78;
  const sampleDate = new Date(Date.UTC(2026, 8, 20));

  return (
    <div>
      <label htmlFor="locale">{t("language")}</label>
      <select id="locale" value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>

      <p data-testid="sample-amount">
        {t("sampleAmountLabel")}: {format.number(sampleAmount, { style: "currency", currency })}
      </p>
      <p data-testid="sample-date">
        {t("sampleDateLabel")}: {format.dateTime(sampleDate, { dateStyle: "long" })}
      </p>
    </div>
  );
}
