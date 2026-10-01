"use client";

import { useFormatter, useTranslations } from "next-intl";
import { THEMES, type ThemePreference } from "@stoafi/core";
import { LOCALES, type Locale } from "@/i18n/messages";
import { useAppStore } from "@/store";
import { useMoney } from "@/lib/use-money";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

export function LocaleSwitcher() {
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const t = useTranslations("settings");
  const format = useFormatter();
  const money = useMoney();

  const sampleAmount = 12_345_678;
  const sampleDate = new Date(Date.UTC(2026, 8, 20));

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="locale">{t("language")}</Label>
          <select
            id="locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="h-9 w-40 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {t(`languageNames.${l}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="theme">{t("theme")}</Label>
          <NativeSelect
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemePreference)}
            className="w-52"
          >
            {THEMES.map((option) => (
              <option key={option} value={option}>
                {t(`themeOptions.${option}`)}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p data-testid="sample-amount">
            {t("sampleAmountLabel")}: {money(sampleAmount)}
          </p>
          <p data-testid="sample-date">
            {t("sampleDateLabel")}: {format.dateTime(sampleDate, { dateStyle: "long" })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
