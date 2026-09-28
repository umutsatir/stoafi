"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { minimumPaymentPayoff } from "@stoafi/core";
import { useMoney } from "@/lib/use-money";
import { useAppStore } from "@/store";
import { MoneyInput } from "./money-input";
import { PercentInput } from "./percent-input";

export function MinimumPaymentCalculator() {
  const [balance, setBalance] = useState(1_000_000);
  const [monthlyRate, setMonthlyRate] = useState(0.02);
  const [pct, setPct] = useState(0.05);
  const [floor, setFloor] = useState(0);
  const t = useTranslations("minimumPayment");
  const money = useMoney();
  const currency = useAppStore((s) => s.currency);

  const result = minimumPaymentPayoff(balance, monthlyRate, { pct, floor });

  return (
    <div>
      <h2>{t("title")}</h2>
      <label htmlFor="balance">{t("balance")}</label>
      <MoneyInput id="balance" currency={currency} value={balance} onChange={setBalance} />

      <label htmlFor="monthly-rate">{t("monthlyRate")}</label>
      <PercentInput id="monthly-rate" value={monthlyRate} onChange={setMonthlyRate} />

      <label htmlFor="min-pct">{t("minPct")}</label>
      <PercentInput id="min-pct" value={pct} onChange={setPct} />

      <label htmlFor="min-floor">{t("minFloor")}</label>
      <MoneyInput id="min-floor" currency={currency} value={floor} onChange={setFloor} />

      <p data-testid="months-to-payoff">{t("monthsToPayoff", { months: result.months })}</p>
      <p data-testid="total-interest">
        {t("totalInterest", { interest: money(result.totalInterest) })}
      </p>
    </div>
  );
}
