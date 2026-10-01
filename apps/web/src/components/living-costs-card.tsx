"use client";

import { useFormatter, useTranslations } from "next-intl";
import { livingCostCheck } from "@stoafi/core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { StatusChip, type ChipTone } from "@/components/ui/status-chip";
import { useMoney } from "@/lib/use-money";
import { MoneyInput } from "./money-input";

export interface LivingCostsCardProps {
  currency: string;
  living: number;
  yearAgo: number | undefined;
  /** Net monthly income and expected yearly inflation (a fraction), for the check below the fields. */
  income: number;
  annualInflation: number;
  onLiving: (minor: number) => void;
  onYearAgo: (minor: number | undefined) => void;
}

const BAND_TONE: Record<"comfortable" | "typical" | "high" | "veryHigh", ChipTone> = {
  comfortable: "success",
  typical: "info",
  high: "warning",
  veryHigh: "danger",
};

/** Monthly groceries and household bills as one figure, with a plain-language check of how it looks. */
export function LivingCostsCard({
  currency,
  living,
  yearAgo,
  income,
  annualInflation,
  onLiving,
  onYearAgo,
}: LivingCostsCardProps) {
  const t = useTranslations("profile.living");
  const money = useMoney();
  const format = useFormatter();
  const pct = (fraction: number) =>
    format.number(fraction, { style: "percent", maximumFractionDigits: 0 });
  const check = livingCostCheck({
    living,
    income,
    annualInflation,
    ...(yearAgo !== undefined ? { yearAgo } : {}),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("hint")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("amount")} htmlFor="living-expenses" hint={t("amountHint")}>
            <MoneyInput
              id="living-expenses"
              currency={currency}
              value={living}
              onChange={onLiving}
            />
          </Field>
          <Field label={t("yearAgo")} htmlFor="living-year-ago" hint={t("yearAgoHint")}>
            <MoneyInput
              id="living-year-ago"
              currency={currency}
              value={yearAgo ?? 0}
              onChange={(minor) => onYearAgo(minor > 0 ? minor : undefined)}
            />
          </Field>
        </div>

        {living > 0 && (
          <div
            className="flex flex-col gap-3 rounded-xl bg-muted/60 p-4"
            data-testid="living-check"
          >
            {check.band && check.share !== null && (
              <div className="flex flex-col gap-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {t("share", { share: pct(check.share) })}
                  <StatusChip tone={BAND_TONE[check.band]}>
                    <span data-testid="living-band">{t(`band.${check.band}`)}</span>
                  </StatusChip>
                </p>
                <p className="text-sm text-muted-foreground">{t(`bandText.${check.band}`)}</p>
              </div>
            )}
            <p className="text-sm" data-testid="living-next-year">
              {t("nextYear", {
                rate: pct(annualInflation),
                amount: money(check.nextYear),
                increase: money(check.increase),
              })}
            </p>
            {check.ownRise !== null && check.versusExpected && (
              <p className="text-sm" data-testid="living-own-rise">
                {t(`own.${check.versusExpected}`, {
                  rise: pct(check.ownRise),
                  expected: pct(annualInflation),
                })}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{t("note")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
