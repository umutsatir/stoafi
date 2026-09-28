"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { minimumPaymentPayoff } from "@stoafi/core";

export function MinimumPaymentCalculator() {
  const [balance, setBalance] = useState(1000);
  const [monthlyRate, setMonthlyRate] = useState(0.02);
  const [pct, setPct] = useState(0.05);
  const [floor, setFloor] = useState(0);
  const t = useTranslations("minimumPayment");

  const result = minimumPaymentPayoff(balance, monthlyRate, { pct, floor });

  return (
    <div>
      <h2>{t("title")}</h2>
      <label htmlFor="balance">{t("balance")}</label>
      <input
        id="balance"
        type="number"
        value={balance}
        onChange={(e) => setBalance(Number(e.target.value))}
      />

      <label htmlFor="monthly-rate">{t("monthlyRate")}</label>
      <input
        id="monthly-rate"
        type="number"
        step="0.001"
        value={monthlyRate}
        onChange={(e) => setMonthlyRate(Number(e.target.value))}
      />

      <label htmlFor="min-pct">{t("minPct")}</label>
      <input
        id="min-pct"
        type="number"
        step="0.01"
        value={pct}
        onChange={(e) => setPct(Number(e.target.value))}
      />

      <label htmlFor="min-floor">{t("minFloor")}</label>
      <input
        id="min-floor"
        type="number"
        value={floor}
        onChange={(e) => setFloor(Number(e.target.value))}
      />

      <p data-testid="months-to-payoff">{t("monthsToPayoff", { months: result.months })}</p>
      <p data-testid="total-interest">
        {t("totalInterest", { interest: result.totalInterest.toFixed(2) })}
      </p>
    </div>
  );
}
