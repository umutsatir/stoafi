"use client";

import { useTranslations } from "next-intl";
import { addMonths, compareMonths, monthsBetween, type Month, type QueueItem } from "@stoafi/core";
import { useMoney } from "@/lib/use-money";

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
    <section aria-label={t("title")}>
      <h2>{t("title")}</h2>
      <p>{t("hint")}</p>
      {running.length === 0 ? (
        <p>{t("empty")}</p>
      ) : (
        <>
          <ul>
            {running.map(({ item, lastMonth, monthlyPayment }) => (
              <li key={item.id} data-testid={`installment-expense-${item.id}`}>
                <span>{item.name}</span>
                <span>{t("row", { amount: money(monthlyPayment), month: lastMonth })}</span>
                <button type="button" onClick={() => onRemove(item)}>
                  {t("remove", { name: item.name })}
                </button>
              </li>
            ))}
          </ul>
          <p data-testid="installments-this-month">
            {t("thisMonth", { amount: money(totalThisMonth) })}
          </p>
        </>
      )}
    </section>
  );
}
