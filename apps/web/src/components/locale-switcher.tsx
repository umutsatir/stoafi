"use client";

import { useFormatter, useTranslations } from "next-intl";
import { THEMES } from "@stoafi/core";
import { LOCALES, type Locale } from "@/i18n/messages";
import { useAppStore } from "@/store";
import { useMoney } from "@/lib/use-money";
import { SegmentedControl } from "@/components/ui/segmented-control";

const CURRENCIES = ["TRY", "USD", "EUR"] as const;
const GROUP_LABEL = "mb-2 mt-4 text-[13px] font-bold";

export function LocaleSwitcher() {
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const currency = useAppStore((s) => s.currency);
  const setCurrency = useAppStore((s) => s.setCurrency);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const t = useTranslations("settings");
  const format = useFormatter();
  const money = useMoney();

  const sampleAmount = 12_345_678;
  const sampleDate = new Date(Date.UTC(2026, 8, 20));

  return (
    <div>
      <p className={GROUP_LABEL} style={{ marginTop: 18 }}>
        {t("language")}
      </p>
      <SegmentedControl
        tone="chips"
        label={t("language")}
        value={locale as Locale}
        onChange={setLocale}
        options={LOCALES.map((l) => ({ value: l, label: t(`languageNames.${l}`) }))}
      />

      <p className={GROUP_LABEL}>{t("currency")}</p>
      <SegmentedControl
        tone="chips"
        label={t("currency")}
        value={currency as (typeof CURRENCIES)[number]}
        onChange={setCurrency}
        options={CURRENCIES.map((c) => ({ value: c, label: c }))}
      />

      <p className={GROUP_LABEL}>{t("theme")}</p>
      <SegmentedControl
        tone="chips"
        label={t("theme")}
        value={theme}
        onChange={setTheme}
        options={THEMES.map((option) => ({ value: option, label: t(`themeOptions.${option}`) }))}
      />

      <div className="mt-4 flex flex-col gap-0.5 text-xs text-muted-foreground">
        <p data-testid="sample-amount">
          {t("sampleAmountLabel")}: {money(sampleAmount)}
        </p>
        <p data-testid="sample-date">
          {t("sampleDateLabel")}: {format.dateTime(sampleDate, { dateStyle: "long" })}
        </p>
      </div>
    </div>
  );
}
