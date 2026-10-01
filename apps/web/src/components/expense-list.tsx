"use client";

import { useLocale, useTranslations } from "next-intl";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { remainingPayments, type Month } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { formatMonth } from "@/lib/format-month";
import { stagger } from "@/lib/utils";
import { tileOf, type ExpenseTile, type ExpenseValue } from "./expense-editor";

const GROUPS: ExpenseTile[] = ["regular", "installment", "loan", "saving"];

export interface ExpenseListProps {
  expenses: ExpenseValue[];
  month: Month;
  onAdd: () => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

/** Recurring lines in groups (bills, installments, loans, saving), each with what is left to pay. */
export function ExpenseList({ expenses, month, onAdd, onEdit, onRemove }: ExpenseListProps) {
  const t = useTranslations("profile.expense");
  const locale = useLocale();
  const entries = expenses.map((expense, index) => ({ expense, index, tile: tileOf(expense) }));

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<Plus className="h-8 w-8" />}
        title={t("empty.title")}
        description={t("empty.text")}
        action={
          <Button type="button" onClick={onAdd}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("addButton")}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {GROUPS.map((group) => {
        const rows = entries.filter((e) => e.tile === group);
        if (rows.length === 0) return null;
        const total = rows.reduce((sum, r) => sum + r.expense.monthly, 0);
        return (
          <section
            key={group}
            aria-label={t(`group.${group}`)}
            data-testid={`expense-group-${group}`}
          >
            <h3 className="mb-1 flex items-baseline justify-between gap-2 text-sm font-semibold">
              <span>{t(`group.${group}`)}</span>
              <span className="font-normal text-muted-foreground">
                <Money value={total} />
              </span>
            </h3>
            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
              {rows.map(({ expense, index }, i) => {
                const left = remainingPayments(expense, month);
                return (
                  <li
                    key={index}
                    data-testid={`expense-row-${index}`}
                    style={stagger(i)}
                    className="rise-in flex flex-wrap items-center gap-x-3 gap-y-1 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{expense.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          expense.dueDay ? t("row.day", { day: expense.dueDay }) : null,
                          left !== null && expense.endMonth
                            ? group === "installment" || group === "loan"
                              ? t("row.left", {
                                  count: left,
                                  month: formatMonth(expense.endMonth, locale),
                                })
                              : t("row.until", { month: formatMonth(expense.endMonth, locale) })
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      <Money value={expense.monthly} />
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("editRow", { name: expense.label })}
                      onClick={() => onEdit(index)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("removeRow", { name: expense.label })}
                      onClick={() => onRemove(index)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <div>
        <Button type="button" variant="outline" onClick={onAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("addButton")}
        </Button>
      </div>
    </div>
  );
}
