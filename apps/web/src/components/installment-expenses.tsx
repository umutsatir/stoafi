"use client";

import { useTranslations } from "next-intl";
import { addMonths, compareMonths, monthsBetween, type Month, type QueueItem } from "@stoafi/core";
import { Trash2 } from "lucide-react";
import { useMoney } from "@/lib/use-money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface InstallmentExpensesProps {
  items: QueueItem[];
  /** The current month; purchases whose last payment is before it are fully paid and hidden. */
  month: Month;
  onRemove: (item: QueueItem) => void;
}

/** Installment purchases as expenses. Read-only view of what the queue derived; nothing is entered here. */
export function InstallmentExpenses({ items, month, onRemove }: InstallmentExpensesProps) {
  const t = useTranslations("installmentExpenses");
  const money = useMoney();

  const running = items.flatMap((item) => {
    const purchase = item.installmentPurchase;
    if (!purchase) return [];
    const payments = purchase.offer.payments;
    const lastMonth = addMonths(purchase.firstMonth, payments.length - 1);
    if (compareMonths(lastMonth, month) < 0) return [];
    // Negative while the plan has not started yet: nothing is due this month.
    const offset = monthsBetween(purchase.firstMonth, month);
    return [
      {
        item,
        lastMonth,
        monthlyPayment: payments[0] ?? 0,
        dueThisMonth: offset >= 0 ? (payments[offset] ?? 0) : 0,
      },
    ];
  });
  const totalThisMonth = running.reduce((sum, r) => sum + r.dueThisMonth, 0);

  return (
    <Card aria-label={t("title")}>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("hint")}</CardDescription>
      </CardHeader>
      <CardContent>
        {running.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-border">
              {running.map(({ item, lastMonth, monthlyPayment }) => (
                <li
                  key={item.id}
                  data-testid={`installment-expense-${item.id}`}
                  className="flex items-center gap-3 py-2 text-sm"
                >
                  <span className="flex-1 font-medium">{item.name}</span>
                  <span className="text-muted-foreground">
                    {t("row", { amount: money(monthlyPayment), month: lastMonth })}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("remove", { name: item.name })}
                    onClick={() => onRemove(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
            <p data-testid="installments-this-month" className="mt-3 text-sm font-medium">
              {t("thisMonth", { amount: money(totalThisMonth) })}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
