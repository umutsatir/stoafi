"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { minimumPaymentBalances, minimumPaymentPayoff } from "@stoafi/core";
import { useMoney } from "@/lib/use-money";
import { useAppStore } from "@/store";
import { Field } from "@/components/ui/field";
import { MoneyInput } from "./money-input";
import { PercentInput } from "./percent-input";

const BAR_MONTHS = 36;

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
  const balances = minimumPaymentBalances(balance, monthlyRate, { pct, floor }, BAR_MONTHS);
  const tallest = Math.max(1, ...balances);

  return (
    <section className="pop-in rounded-card bg-card px-8 py-7" aria-label={t("title")}>
      <h2 className="text-[22px] font-extrabold tracking-[-0.03em]">{t("title")}</h2>
      <p className="mt-1 text-[13px] leading-normal text-muted-foreground">{t("hint")}</p>
      <div className="mt-[18px] grid gap-3 sm:grid-cols-2">
        <Field label={t("balance")} htmlFor="balance" className="text-[12.5px]">
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

      <div className="mt-5 flex h-[70px] items-end gap-[3px]" aria-hidden="true">
        {balances.map((value, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-[4px] rounded-b-[1px] bg-c3 transition-[height] duration-300"
            style={{ height: Math.max(2, (value / tallest) * 70) }}
          />
        ))}
      </div>

      <div className="mt-3.5 rounded-[20px] bg-muted px-[18px] py-3.5">
        <p data-testid="months-to-payoff" className="text-[19px] font-extrabold tracking-[-0.03em]">
          {result.neverPaysOff ? t("neverPaysOff") : t("monthsToPayoff", { months: result.months })}
        </p>
        {!result.neverPaysOff && (
          <p data-testid="total-interest" className="mt-1 text-sm font-bold text-destructive">
            {t("totalInterest", { interest: money(result.totalInterest) })}
          </p>
        )}
      </div>
    </section>
  );
}
