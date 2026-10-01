"use client";

import { useTranslations } from "next-intl";
import { Banknote, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { stagger } from "@/lib/utils";
import type { SalaryValue } from "./salary-editor";

export interface SalaryListProps {
  salaries: SalaryValue[];
  onAdd: () => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

/** Incomes as rows, like the expenses below them, with the total on top. */
export function SalaryList({ salaries, onAdd, onEdit, onRemove }: SalaryListProps) {
  const t = useTranslations("profile.salary");
  const total = salaries.reduce((sum, s) => sum + s.monthly, 0);

  if (salaries.length === 0) {
    return (
      <EmptyState
        icon={<Banknote className="h-8 w-8" />}
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
    <div className="flex flex-col gap-3">
      <p className="flex items-baseline justify-between gap-2 text-sm font-semibold">
        <span>{t("total")}</span>
        <span data-testid="salary-total">
          <Money value={total} />
        </span>
      </p>
      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {salaries.map((salary, index) => (
          <li
            key={index}
            data-testid={`salary-row-${index}`}
            style={stagger(index)}
            className="rise-in flex flex-wrap items-center gap-x-3 gap-y-1 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{salary.label}</p>
              <p className="text-xs text-muted-foreground">
                {t("row.day", { day: salary.payDay ?? 1 })}
              </p>
            </div>
            <span className="text-sm font-semibold">
              <Money value={salary.monthly} />
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("editRow", { name: salary.label })}
              onClick={() => onEdit(index)}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("removeRow", { name: salary.label })}
              onClick={() => onRemove(index)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
      <div>
        <Button type="button" variant="outline" onClick={onAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("addButton")}
        </Button>
      </div>
    </div>
  );
}
