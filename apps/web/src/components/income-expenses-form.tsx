"use client";

import { useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import type { Month, Profile } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DayOfMonthSelect } from "@/components/ui/day-of-month-select";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { notifyUndo, useUndoLabel } from "@/components/ui/toaster";
import { monthOf, localIsoDate } from "@/lib/clock";
import { ExpenseEditor, type ExpenseValue } from "./expense-editor";
import { ExpenseList } from "./expense-list";
import { MoneyInput } from "./money-input";

/** The recurring cash-flow part of the profile: what comes in and what goes out every month. */
export type IncomeExpensesValue = Pick<Profile, "incomes" | "fixedExpenses" | "livingExpenses">;

export interface IncomeExpensesFormProps {
  initial?: IncomeExpensesValue;
  currency?: string;
  /** Suggested end month when the user turns an end month on. */
  currentMonth?: Month;
  onSave: (value: IncomeExpensesValue) => void | Promise<void>;
}

interface SalaryRow {
  key: number;
  label: string;
  monthly: number;
  /** Left undefined until the user picks one, so an untouched row saves without it. */
  payDay?: number;
}

function isBlank(row: { label: string; monthly: number }): boolean {
  return row.label.trim() === "" && row.monthly === 0;
}

export function IncomeExpensesForm({
  initial,
  currency = "TRY",
  currentMonth,
  onSave,
}: IncomeExpensesFormProps) {
  const t = useTranslations("profile");
  const undoLabel = useUndoLabel();
  const month = currentMonth ?? monthOf(localIsoDate(new Date()));
  const nextKey = useRef(0);
  const newKey = () => nextKey.current++;

  const [salaries, setSalaries] = useState<SalaryRow[]>(() =>
    initial && initial.incomes.length > 0
      ? initial.incomes.map((i) => ({
          key: newKey(),
          label: i.label,
          monthly: i.monthly,
          ...(i.payDay !== undefined ? { payDay: i.payDay } : {}),
        }))
      : [{ key: newKey(), label: "", monthly: 0 }],
  );
  const [expenses, setExpenses] = useState<ExpenseValue[]>(() => initial?.fixedExpenses ?? []);
  // null: closed; -1: adding; otherwise the index being edited.
  const [editing, setEditing] = useState<number | null>(null);
  const [livingExpenses, setLivingExpenses] = useState(initial?.livingExpenses ?? 0);

  function patchSalary(key: number, patch: Partial<SalaryRow>) {
    setSalaries((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function buildValue(fixedExpenses: ExpenseValue[]): IncomeExpensesValue {
    return {
      incomes: salaries
        .filter((r) => !isBlank(r))
        .map((r) => ({
          label: r.label.trim(),
          monthly: r.monthly,
          ...(r.payDay !== undefined ? { payDay: r.payDay } : {}),
        })),
      fixedExpenses,
      livingExpenses,
    };
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void onSave(buildValue(expenses));
  }

  // Adding, editing and removing an expense saves straight away: there is no "forgot to save" for them.
  function commitExpenses(next: ExpenseValue[]) {
    setExpenses(next);
    void onSave(buildValue(next));
  }

  function removeExpense(index: number) {
    const previous = expenses;
    const removed = previous[index];
    if (!removed) return;
    commitExpenses(previous.filter((_, i) => i !== index));
    notifyUndo(t("expense.removed", { name: removed.label }), undoLabel, () =>
      commitExpenses(previous),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("salariesTitle")}</CardTitle>
          <CardDescription>{t("salariesHint")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {salaries.map((row, index) => {
            const n = index + 1;
            return (
              <div key={row.key} className="flex flex-wrap items-center gap-2">
                <Input
                  type="text"
                  className="w-full sm:w-56"
                  aria-label={t("salaryName", { n })}
                  placeholder={t("salaryNamePlaceholder")}
                  value={row.label}
                  onChange={(e) => patchSalary(row.key, { label: e.target.value })}
                />
                <MoneyInput
                  id={`salary-${row.key}`}
                  aria-label={t("salaryAmount", { n })}
                  currency={currency}
                  value={row.monthly}
                  onChange={(monthly) => patchSalary(row.key, { monthly })}
                />
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {t("payDayLabel")}
                  <DayOfMonthSelect
                    aria-label={t("salaryPayDay", { n })}
                    value={row.payDay ?? 1}
                    onChange={(payDay) => patchSalary(row.key, { payDay })}
                  />
                </span>
                {salaries.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("removeSalary", { n })}
                    onClick={() => setSalaries((rows) => rows.filter((r) => r.key !== row.key))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setSalaries((rows) => [...rows, { key: newKey(), label: "", monthly: 0 }])
              }
            >
              <Plus className="h-4 w-4" />
              {t("addSalary")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("expensesTitle")}</CardTitle>
          <CardDescription>{t("expensesHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseList
            expenses={expenses}
            month={month}
            onAdd={() => setEditing(-1)}
            onEdit={setEditing}
            onRemove={removeExpense}
          />
        </CardContent>
      </Card>

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        {editing !== null && (
          <SheetContent title={editing === -1 ? t("expense.addTitle") : t("expense.editTitle")}>
            <ExpenseEditor
              {...(editing >= 0 && expenses[editing] ? { initial: expenses[editing] } : {})}
              currency={currency}
              currentMonth={month}
              onCancel={() => setEditing(null)}
              onSave={(value) => {
                commitExpenses(
                  editing >= 0
                    ? expenses.map((e, i) => (i === editing ? value : e))
                    : [...expenses, value],
                );
                setEditing(null);
              }}
            />
          </SheetContent>
        )}
      </Sheet>

      <Card>
        <CardContent className="pt-6">
          <Field
            label={t("livingExpenses")}
            htmlFor="living-expenses"
            hint={t("livingExpensesHint")}
          >
            <MoneyInput
              id="living-expenses"
              currency={currency}
              value={livingExpenses}
              onChange={setLivingExpenses}
            />
          </Field>
        </CardContent>
      </Card>

      <div>
        <Button type="submit">{t("save")}</Button>
      </div>
    </form>
  );
}
