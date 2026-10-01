"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { minimumPaymentPayoff } from "@stoafi/core";
import { useMoney } from "@/lib/use-money";
import { useAppStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { MoneyInput } from "./money-input";
import { PercentInput } from "./percent-input";

export function MinimumPaymentCalculator({
  initialBalance = 1_000_000,
}: {
  initialBalance?: number;
}) {
  const [balance, setBalance] = useState(initialBalance);
  const [monthlyRate, setMonthlyRate] = useState(0.02);
  const [pct, setPct] = useState(0.05);
  const [floor, setFloor] = useState(0);
  const t = useTranslations("minimumPayment");
  const money = useMoney();
  const currency = useAppStore((s) => s.currency);

  const result = minimumPaymentPayoff(balance, monthlyRate, { pct, floor });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("balance")} htmlFor="balance">
            <MoneyInput id="balance" currency={currency} value={balance} onChange={setBalance} />
          </Field>
          <Field label={t("monthlyRate")} htmlFor="monthly-rate">
            <PercentInput id="monthly-rate" value={monthlyRate} onChange={setMonthlyRate} />
          </Field>
          <Field label={t("minPct")} htmlFor="min-pct">
            <PercentInput id="min-pct" value={pct} onChange={setPct} />
          </Field>
          <Field label={t("minFloor")} htmlFor="min-floor">
            <MoneyInput id="min-floor" currency={currency} value={floor} onChange={setFloor} />
          </Field>
        </div>

        <div className="flex flex-col gap-1 rounded-md border border-border bg-secondary p-3 text-sm">
          <p data-testid="months-to-payoff">
            {result.neverPaysOff
              ? t("neverPaysOff")
              : t("monthsToPayoff", { months: result.months })}
          </p>
          {!result.neverPaysOff && (
            <p data-testid="total-interest">
              {t("totalInterest", { interest: money(result.totalInterest) })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
