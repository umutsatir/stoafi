"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { compareOffers, type OfferResult } from "@stoafi/core";
import { LessonLink } from "@/components/lesson-link";
import { Plus, Trash2 } from "lucide-react";
import { useMoney } from "@/lib/use-money";
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
import { cn } from "@/lib/utils";

// On a phone the table would scroll sideways and hide the "Select" button, so each offer becomes a
// small card: two columns, every value carrying its own label (the header row is hidden).
const MOBILE_ROW =
  "max-sm:grid max-sm:grid-cols-2 max-sm:gap-x-3 max-sm:gap-y-2.5 max-sm:rounded-[18px] max-sm:border-0 max-sm:bg-muted/60 max-sm:p-3";
const MOBILE_CELL =
  "max-sm:block max-sm:p-0 max-sm:before:mb-1 max-sm:before:block max-sm:before:text-xs max-sm:before:font-bold max-sm:before:text-muted-foreground max-sm:before:content-[attr(data-label)]";

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
  const money = useMoney();
  const currency = useAppStore((s) => s.currency);

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
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-xl font-extrabold tracking-[-0.03em]">{t("title")}</h2>
        <p className="mt-1 text-[12.5px] font-semibold text-muted-foreground">{t("hint")}</p>
      </div>
      <LessonLink lessonId="time-value-of-money" testId="lesson-link-time-value-of-money" />
      <Table className="max-sm:block">
        <TableHeader className="max-sm:hidden">
          <TableRow>
            <TableHead>{t("months")}</TableHead>
            <TableHead>{t("monthlyPayment")}</TableHead>
            <TableHead>{t("totalPaid")}</TableHead>
            <TableHead>{t("pv")}</TableHead>
            <TableHead>{t("realSaving")}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody className="max-sm:flex max-sm:flex-col max-sm:gap-2.5">
          {rows.map((row, index) => {
            const result = resultByKey.get(row.key);
            const n = index + 1;
            return (
              <TableRow
                key={row.key}
                data-testid={`offer-row-${row.months}`}
                className={MOBILE_ROW}
              >
                <TableCell data-label={t("months")} className={MOBILE_CELL}>
                  <Input
                    aria-label={t("monthsAriaLabel", { index: n })}
                    type="number"
                    min={1}
                    step={1}
                    className="w-full text-[15px] sm:w-24"
                    value={row.months}
                    onChange={(e) =>
                      patch(row.key, { months: Math.max(0, Math.floor(Number(e.target.value))) })
                    }
                  />
                </TableCell>
                <TableCell
                  data-testid={`monthly-payment-${row.months}`}
                  data-label={t("monthlyPayment")}
                  className={cn(MOBILE_CELL, "sm:min-w-[180px]")}
                >
                  <MoneyInput
                    id={`offer-payment-${row.key}`}
                    aria-label={t("paymentAriaLabel", { index: n })}
                    currency={currency}
                    value={row.monthlyPayment}
                    onChange={(monthlyPayment) => patch(row.key, { monthlyPayment })}
                  />
                </TableCell>
                <TableCell
                  data-testid={`total-paid-${row.months}`}
                  data-label={t("totalPaid")}
                  className={MOBILE_CELL}
                >
                  {result ? money(row.months * row.monthlyPayment) : t("incomplete")}
                </TableCell>
                <TableCell
                  data-testid={`pv-${row.months}`}
                  data-label={t("pv")}
                  className={MOBILE_CELL}
                >
                  {result ? money(Math.round(result.pv)) : t("incomplete")}
                </TableCell>
                <TableCell
                  data-testid={`real-saving-${row.months}`}
                  data-label={t("realSaving")}
                  className={MOBILE_CELL}
                >
                  {result ? (
                    <span
                      className={`rounded-full bg-muted px-2.5 py-0.5 text-xs font-extrabold ${
                        result.realSaving >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {`${(result.realSaving * 100).toFixed(1)}%`}
                    </span>
                  ) : (
                    t("incomplete")
                  )}
                </TableCell>
                <TableCell className="max-sm:flex max-sm:items-end max-sm:justify-end max-sm:p-0">
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
