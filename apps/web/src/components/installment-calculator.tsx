"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { compareOffers, type OfferResult } from "@stoafi/core";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";
import { Plus, Trash2 } from "lucide-react";
import { useMoney } from "@/lib/use-money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div>
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("hint")}</p>
      </div>
      {timeValueLesson && (
        <a
          href={`#lesson-${timeValueLesson.id}`}
          aria-label={`${timeValueLesson.id} lesson`}
          data-testid="lesson-link-time-value-of-money"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          {timeValueLesson.title}
        </a>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("months")}</TableHead>
            <TableHead>{t("monthlyPayment")}</TableHead>
            <TableHead>{t("totalPaid")}</TableHead>
            <TableHead>{t("pv")}</TableHead>
            <TableHead>{t("realSaving")}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const result = resultByKey.get(row.key);
            const n = index + 1;
            return (
              <TableRow key={row.key} data-testid={`offer-row-${row.months}`}>
                <TableCell>
                  <Input
                    aria-label={t("monthsAriaLabel", { index: n })}
                    type="number"
                    min={1}
                    step={1}
                    className="w-20"
                    value={row.months}
                    onChange={(e) =>
                      patch(row.key, { months: Math.max(0, Math.floor(Number(e.target.value))) })
                    }
                  />
                </TableCell>
                <TableCell data-testid={`monthly-payment-${row.months}`}>
                  <MoneyInput
                    id={`offer-payment-${row.key}`}
                    aria-label={t("paymentAriaLabel", { index: n })}
                    currency={currency}
                    value={row.monthlyPayment}
                    onChange={(monthlyPayment) => patch(row.key, { monthlyPayment })}
                  />
                </TableCell>
                <TableCell data-testid={`total-paid-${row.months}`}>
                  {result ? money(row.months * row.monthlyPayment) : t("incomplete")}
                </TableCell>
                <TableCell data-testid={`pv-${row.months}`}>
                  {result ? money(Math.round(result.pv)) : t("incomplete")}
                </TableCell>
                <TableCell data-testid={`real-saving-${row.months}`}>
                  {result ? (
                    <Badge variant={result.realSaving >= 0 ? "secondary" : "destructive"}>
                      {`${(result.realSaving * 100).toFixed(1)}%`}
                    </Badge>
                  ) : (
                    t("incomplete")
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {result && (
                      <Button type="button" size="sm" onClick={() => onSelect(result)}>
                        {t("select")}
                      </Button>
                    )}
                    {rows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("removeOffer", { index: n })}
                        onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setRows((prev) => [...prev, { key: nextKey.current++, months: 3, monthlyPayment: 0 }])
          }
        >
          <Plus className="h-4 w-4" />
          {t("addOffer")}
        </Button>
      </div>
    </div>
  );
}
