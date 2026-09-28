"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { compareOffers, type OfferResult } from "@stoafi/core";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";
import { useMoney } from "@/lib/use-money";
import { useAppStore } from "@/store";
import { MoneyInput } from "./money-input";

export interface InstallmentCalculatorProps {
  cashPrice: number;
  annualInflation: number;
  initialOfferMonths?: number[];
  onSelect: (offer: OfferResult) => void;
}

interface OfferRow {
  key: number;
  months: number;
  monthlyPayment: number;
}

/**
 * Side-by-side offers. Each row starts at the interest-free split
 * (price / months) as a placeholder; the user overwrites the payment with the
 * real quote from the bank or store.
 */
export function InstallmentCalculator({
  cashPrice,
  annualInflation,
  initialOfferMonths = [3, 6, 9, 12],
  onSelect,
}: InstallmentCalculatorProps) {
  const nextKey = useRef(0);
  const [rows, setRows] = useState<OfferRow[]>(() =>
    initialOfferMonths.map((months) => ({
      key: nextKey.current++,
      months,
      monthlyPayment: Math.round(cashPrice / months),
    })),
  );
  const t = useTranslations("installments");
  const locale = useLocale() as Locale;
  const money = useMoney();
  const currency = useAppStore((s) => s.currency);
  const timeValueLesson = getLessonCard("time-value-of-money", locale);

  function patch(key: number, change: Partial<OfferRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...change } : r)));
  }

  // Only complete rows (months >= 1 and a payment) are computed: a zero-month
  // plan has no payments to average, so it would produce NaN.
  const complete = rows.filter((r) => r.months >= 1 && r.monthlyPayment > 0);
  const results = compareOffers(
    cashPrice,
    complete.map((r) => ({
      months: r.months,
      payments: Array.from({ length: r.months }, () => r.monthlyPayment),
    })),
    annualInflation,
  );
  const resultByKey = new Map(complete.map((r, i) => [r.key, results[i]]));

  return (
    <div>
      <h2>{t("title")}</h2>
      <p>{t("hint")}</p>
      {timeValueLesson && (
        <a
          href={`#lesson-${timeValueLesson.id}`}
          aria-label={`${timeValueLesson.id} lesson`}
          data-testid="lesson-link-time-value-of-money"
        >
          {timeValueLesson.title}
        </a>
      )}
      <table>
        <thead>
          <tr>
            <th>{t("months")}</th>
            <th>{t("monthlyPayment")}</th>
            <th>{t("totalPaid")}</th>
            <th>{t("pv")}</th>
            <th>{t("realSaving")}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const result = resultByKey.get(row.key);
            const n = index + 1;
            return (
              <tr key={row.key} data-testid={`offer-row-${row.months}`}>
                <td>
                  <input
                    aria-label={t("monthsAriaLabel", { index: n })}
                    type="number"
                    min={1}
                    step={1}
                    value={row.months}
                    onChange={(e) =>
                      patch(row.key, { months: Math.max(0, Math.floor(Number(e.target.value))) })
                    }
                  />
                </td>
                <td data-testid={`monthly-payment-${row.months}`}>
                  <MoneyInput
                    id={`offer-payment-${row.key}`}
                    aria-label={t("paymentAriaLabel", { index: n })}
                    currency={currency}
                    value={row.monthlyPayment}
                    onChange={(monthlyPayment) => patch(row.key, { monthlyPayment })}
                  />
                </td>
                <td data-testid={`total-paid-${row.months}`}>
                  {result ? money(row.months * row.monthlyPayment) : t("incomplete")}
                </td>
                <td data-testid={`pv-${row.months}`}>
                  {result ? money(Math.round(result.pv)) : t("incomplete")}
                </td>
                <td data-testid={`real-saving-${row.months}`}>
                  {result ? `${(result.realSaving * 100).toFixed(1)}%` : t("incomplete")}
                </td>
                <td>
                  {result && (
                    <button type="button" onClick={() => onSelect(result)}>
                      {t("select")}
                    </button>
                  )}
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                    >
                      {t("removeOffer", { index: n })}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button
        type="button"
        onClick={() =>
          setRows((prev) => [...prev, { key: nextKey.current++, months: 3, monthlyPayment: 0 }])
        }
      >
        {t("addOffer")}
      </button>
    </div>
  );
}
