"use client";

import { useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { MonthSchema, type Bucket, type Month, type Profile } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DayOfMonthSelect } from "@/components/ui/day-of-month-select";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
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

interface ExpenseRow {
  key: number;
  label: string;
  monthly: number;
  bucket: Bucket;
  dueDay?: number;
  /** undefined: recurs indefinitely. A string (possibly not yet a full YYYY-MM) while an end month is on. */
  endMonth?: string;
}

type ExpenseBucket = Extract<Bucket, "needs" | "wants">;
const EXPENSE_BUCKETS: ExpenseBucket[] = ["needs", "wants"];

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
  const [expenses, setExpenses] = useState<ExpenseRow[]>(() =>
    (initial?.fixedExpenses ?? []).map((e) => ({
      key: newKey(),
      label: e.label,
      monthly: e.monthly,
      bucket: e.bucket,
      ...(e.dueDay !== undefined ? { dueDay: e.dueDay } : {}),
      ...(e.endMonth !== undefined ? { endMonth: e.endMonth } : {}),
    })),
  );
  const [livingExpenses, setLivingExpenses] = useState(initial?.livingExpenses ?? 0);

  function patchSalary(key: number, patch: Partial<SalaryRow>) {
    setSalaries((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function patchExpense(key: number, patch: Partial<ExpenseRow>) {
    setExpenses((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void onSave({
      incomes: salaries
        .filter((r) => !isBlank(r))
        .map((r) => ({
          label: r.label.trim(),
          monthly: r.monthly,
          ...(r.payDay !== undefined ? { payDay: r.payDay } : {}),
        })),
      fixedExpenses: expenses
        .filter((r) => !isBlank(r))
        .map((r) => {
          // An end month that is still being typed is not a Month yet; leave it out.
          const endMonth = MonthSchema.safeParse(r.endMonth);
          return {
            label: r.label.trim(),
            monthly: r.monthly,
            bucket: r.bucket,
            ...(r.dueDay !== undefined ? { dueDay: r.dueDay } : {}),
            ...(endMonth.success ? { endMonth: endMonth.data } : {}),
          };
        }),
      livingExpenses,
    });
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
        <CardContent className="flex flex-col gap-3">
          {expenses.map((row, index) => {
            const n = index + 1;
            return (
              <div key={row.key} className="flex flex-wrap items-center gap-2">
                <Input
                  type="text"
                  className="w-full sm:w-56"
                  aria-label={t("expenseName", { n })}
                  placeholder={t("expenseNamePlaceholder")}
                  value={row.label}
                  onChange={(e) => patchExpense(row.key, { label: e.target.value })}
                />
                <MoneyInput
                  id={`expense-${row.key}`}
                  aria-label={t("expenseAmount", { n })}
                  currency={currency}
                  value={row.monthly}
                  onChange={(monthly) => patchExpense(row.key, { monthly })}
                />
                <NativeSelect
                  className="w-32"
                  aria-label={t("expenseType", { n })}
                  value={row.bucket}
                  onChange={(e) =>
                    patchExpense(row.key, { bucket: e.target.value as ExpenseBucket })
                  }
                >
                  {EXPENSE_BUCKETS.map((bucket) => (
                    <option key={bucket} value={bucket}>
                      {t(bucket === "needs" ? "typeNeed" : "typeWant")}
                    </option>
                  ))}
                </NativeSelect>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {t("dueDayLabel")}
                  <DayOfMonthSelect
                    aria-label={t("expenseDueDay", { n })}
                    value={row.dueDay ?? 1}
                    onChange={(dueDay) => patchExpense(row.key, { dueDay })}
                  />
                </span>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    aria-label={t("expenseHasEnd", { n })}
                    checked={row.endMonth !== undefined}
                    onChange={(e) =>
                      patchExpense(row.key, {
                        endMonth: e.target.checked ? (currentMonth ?? "") : undefined,
                      })
                    }
                  />
                  {t("endsLabel")}
                </label>
                {row.endMonth !== undefined && (
                  <Input
                    type="month"
                    className="w-40"
                    aria-label={t("expenseEndMonth", { n })}
                    value={row.endMonth}
                    onChange={(e) => patchExpense(row.key, { endMonth: e.target.value })}
                  />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("removeExpense", { n })}
                  onClick={() => setExpenses((rows) => rows.filter((r) => r.key !== row.key))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setExpenses((rows) => [
                  ...rows,
                  { key: newKey(), label: "", monthly: 0, bucket: "needs" },
                ])
              }
            >
              <Plus className="h-4 w-4" />
              {t("addExpense")}
            </Button>
          </div>
        </CardContent>
      </Card>

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
