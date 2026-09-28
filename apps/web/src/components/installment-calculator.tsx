"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { compareOffers, type OfferResult } from "@stoafi/core";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";

export interface InstallmentCalculatorProps {
  cashPrice: number;
  annualInflation: number;
  initialOfferMonths?: number[];
  onSelect: (offer: OfferResult) => void;
}

export function InstallmentCalculator({
  cashPrice,
  annualInflation,
  initialOfferMonths = [3, 6, 9, 12],
  onSelect,
}: InstallmentCalculatorProps) {
  const [offers, setOffers] = useState(
    initialOfferMonths.map((months) => ({
      months,
      monthlyPayment: Math.round(cashPrice / months),
    })),
  );

  const results = compareOffers(
    cashPrice,
    offers.map((o) => ({
      months: o.months,
      payments: Array.from({ length: o.months }, () => o.monthlyPayment),
    })),
    annualInflation,
  );
  const t = useTranslations("installments");
  const locale = useLocale() as Locale;
  const timeValueLesson = getLessonCard("time-value-of-money", locale);

  return (
    <div>
      <h2>{t("title")}</h2>
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
            <th>{t("pv")}</th>
            <th>{t("realSaving")}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr key={result.months} data-testid={`offer-row-${result.months}`}>
              <td>
                <input
                  aria-label={t("monthsAriaLabel", { index: index + 1 })}
                  type="number"
                  value={offers[index]?.months ?? 0}
                  onChange={(e) => {
                    const months = Number(e.target.value);
                    setOffers((prev) =>
                      prev.map((o, i) =>
                        i === index
                          ? { months, monthlyPayment: Math.round(cashPrice / months) }
                          : o,
                      ),
                    );
                  }}
                />
              </td>
              <td data-testid={`monthly-payment-${result.months}`}>{result.monthlyPayment}</td>
              <td data-testid={`pv-${result.months}`}>{result.pv.toFixed(2)}</td>
              <td data-testid={`real-saving-${result.months}`}>
                {(result.realSaving * 100).toFixed(1)}%
              </td>
              <td>
                <button type="button" onClick={() => onSelect(result)}>
                  {t("select")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
