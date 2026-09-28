"use client";

import { useFormatter, useTranslations } from "next-intl";
import { LOCALES, type Locale } from "@/i18n/messages";
import { useAppStore } from "@/store";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function LocaleSwitcher() {
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const currency = useAppStore((s) => s.currency);
  const t = useTranslations("settings");
  const format = useFormatter();

  const sampleAmount = 123456.78;
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
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p data-testid="sample-amount">
            {t("sampleAmountLabel")}: {format.number(sampleAmount, { style: "currency", currency })}
          </p>
          <p data-testid="sample-date">
            {t("sampleDateLabel")}: {format.dateTime(sampleDate, { dateStyle: "long" })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
