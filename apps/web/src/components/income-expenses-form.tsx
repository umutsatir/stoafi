"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { Card as PaymentCard, Month, Profile } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { notifyUndo, useUndoLabel } from "@/components/ui/toaster";
import { localIsoDate, monthOf } from "@/lib/clock";
import { ExpenseEditor, type ExpenseValue } from "./expense-editor";
import { ExpenseList } from "./expense-list";
import { LivingCostsCard } from "./living-costs-card";
import { SalaryEditor, type SalaryValue } from "./salary-editor";
import { SalaryList } from "./salary-list";

/** The recurring cash-flow part of the profile: what comes in and what goes out every month. */
export type IncomeExpensesValue = Pick<Profile, "incomes" | "fixedExpenses" | "livingExpenses"> & {
  livingExpensesYearAgo?: number;
};

export interface IncomeExpensesFormProps {
  initial?: IncomeExpensesValue & { annualInflationExpectation?: number };
  currency?: string;
  /** Suggested end month when the user turns an end month on. */
  currentMonth?: Month;
  /** Cards an installment can be put on, so it counts against that card's limit. */
  cards?: PaymentCard[];
  onSave: (value: IncomeExpensesValue) => void | Promise<void>;
}

/**
 * Which panel is open: nothing, adding (-1) or editing the row at that index. Incomes and expenses are
 * added, changed and removed one at a time and saved at once; the button saves the living costs.
 */
type Open = null | { kind: "salary" | "expense"; index: number };

export function IncomeExpensesForm({
  initial,
  currency = "TRY",
  currentMonth,
  cards = [],
  onSave,
}: IncomeExpensesFormProps) {
  const t = useTranslations("profile");
  const undoLabel = useUndoLabel();
  const month = currentMonth ?? monthOf(localIsoDate(new Date()));

  const [salaries, setSalaries] = useState<SalaryValue[]>(() => initial?.incomes ?? []);
  const [expenses, setExpenses] = useState<ExpenseValue[]>(() => initial?.fixedExpenses ?? []);
  const [livingExpenses, setLivingExpenses] = useState(initial?.livingExpenses ?? 0);
  const [yearAgo, setYearAgo] = useState<number | undefined>(initial?.livingExpensesYearAgo);
  const [open, setOpen] = useState<Open>(null);

  function buildValue(
    next: { incomes?: SalaryValue[]; fixedExpenses?: ExpenseValue[] } = {},
  ): IncomeExpensesValue {
    return {
      incomes: next.incomes ?? salaries,
      fixedExpenses: next.fixedExpenses ?? expenses,
      livingExpenses,
      ...(yearAgo !== undefined ? { livingExpensesYearAgo: yearAgo } : {}),
    };
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void onSave(buildValue());
  }

  function commitSalaries(next: SalaryValue[]) {
    setSalaries(next);
    void onSave(buildValue({ incomes: next }));
  }

  function commitExpenses(next: ExpenseValue[]) {
    setExpenses(next);
    void onSave(buildValue({ fixedExpenses: next }));
  }

  function removeSalary(index: number) {
    const previous = salaries;
    const removed = previous[index];
    if (!removed) return;
    commitSalaries(previous.filter((_, i) => i !== index));
    notifyUndo(t("salary.removed", { name: removed.label }), undoLabel, () =>
      commitSalaries(previous),
    );
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

  const income = salaries.reduce((sum, s) => sum + s.monthly, 0);
  const editingSalary = open?.kind === "salary" ? salaries[open.index] : undefined;
  const editingExpense = open?.kind === "expense" ? expenses[open.index] : undefined;

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("salariesTitle")}</CardTitle>
            <CardDescription>{t("salariesHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SalaryList
              salaries={salaries}
              onAdd={() => setOpen({ kind: "salary", index: -1 })}
              onEdit={(index) => setOpen({ kind: "salary", index })}
              onRemove={removeSalary}
            />
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
              onAdd={() => setOpen({ kind: "expense", index: -1 })}
              onEdit={(index) => setOpen({ kind: "expense", index })}
              onRemove={removeExpense}
            />
          </CardContent>
        </Card>

        <LivingCostsCard
          currency={currency}
          living={livingExpenses}
          yearAgo={yearAgo}
          income={income}
          annualInflation={initial?.annualInflationExpectation ?? 0.3}
          onLiving={setLivingExpenses}
          onYearAgo={setYearAgo}
        />

        <div>
          <Button type="submit">{t("save")}</Button>
        </div>
      </form>

      <Sheet open={open?.kind === "salary"} onOpenChange={(isOpen) => !isOpen && setOpen(null)}>
        {open?.kind === "salary" && (
          <SheetContent title={open.index === -1 ? t("salary.addTitle") : t("salary.editTitle")}>
            <SalaryEditor
              key={open.index}
              {...(editingSalary ? { initial: editingSalary } : {})}
              currency={currency}
              onCancel={() => setOpen(null)}
              onSave={(value) => {
                commitSalaries(
                  open.index >= 0
                    ? salaries.map((s, i) => (i === open.index ? value : s))
                    : [...salaries, value],
                );
                setOpen(null);
              }}
            />
          </SheetContent>
        )}
      </Sheet>

      <Sheet open={open?.kind === "expense"} onOpenChange={(isOpen) => !isOpen && setOpen(null)}>
        {open?.kind === "expense" && (
          <SheetContent title={open.index === -1 ? t("expense.addTitle") : t("expense.editTitle")}>
            <ExpenseEditor
              key={open.index}
              {...(editingExpense ? { initial: editingExpense } : {})}
              currency={currency}
              currentMonth={month}
              cards={cards}
              onCancel={() => setOpen(null)}
              onSave={(value) => {
                commitExpenses(
                  open.index >= 0
                    ? expenses.map((e, i) => (i === open.index ? value : e))
                    : [...expenses, value],
                );
                setOpen(null);
              }}
            />
          </SheetContent>
        )}
      </Sheet>
    </>
  );
}
