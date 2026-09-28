"use client";

import { useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import type { Bucket, Profile } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { MoneyInput } from "./money-input";
import { PercentInput } from "./percent-input";

export interface ProfileFormProps {
  initial?: Profile;
  currency?: string;
  onSave: (profile: Profile) => void | Promise<void>;
}

interface SalaryRow {
  key: number;
  label: string;
  monthly: number;
}

interface ExpenseRow extends SalaryRow {
  bucket: Bucket;
}

type ExpenseBucket = Extract<Bucket, "needs" | "wants">;
const EXPENSE_BUCKETS: ExpenseBucket[] = ["needs", "wants"];

function isBlank(row: SalaryRow): boolean {
  return row.label.trim() === "" && row.monthly === 0;
}

export function ProfileForm({ initial, currency = "TRY", onSave }: ProfileFormProps) {
  const t = useTranslations("profile");
  const nextKey = useRef(0);
  const newKey = () => nextKey.current++;

  const [salaries, setSalaries] = useState<SalaryRow[]>(() =>
    initial && initial.incomes.length > 0
      ? initial.incomes.map((i) => ({ key: newKey(), label: i.label, monthly: i.monthly }))
      : [{ key: newKey(), label: "", monthly: 0 }],
  );
  const [expenses, setExpenses] = useState<ExpenseRow[]>(() =>
    (initial?.fixedExpenses ?? []).map((e) => ({
      key: newKey(),
      label: e.label,
      monthly: e.monthly,
      bucket: e.bucket,
    })),
  );
  const [livingExpenses, setLivingExpenses] = useState(initial?.livingExpenses ?? 0);
  const [savings, setSavings] = useState(initial?.savings ?? 0);
  const [fundMonths, setFundMonths] = useState(initial?.emergencyFundTargetMonths ?? 6);
  const [inflation, setInflation] = useState(initial?.annualInflationExpectation ?? 0.3);

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
        .map((r) => ({ label: r.label.trim(), monthly: r.monthly })),
      fixedExpenses: expenses
        .filter((r) => !isBlank(r))
        .map((r) => ({ label: r.label.trim(), monthly: r.monthly, bucket: r.bucket })),
      livingExpenses,
      savings,
      emergencyFundTargetMonths: fundMonths,
      annualInflationExpectation: inflation,
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
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
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
          <Field label={t("currentSavings")} htmlFor="savings">
            <MoneyInput id="savings" currency={currency} value={savings} onChange={setSavings} />
          </Field>
          <Field label={t("emergencyFundMonths")} htmlFor="fund-months">
            <Input
              id="fund-months"
              type="number"
              min={0}
              step="any"
              className="w-40"
              value={fundMonths}
              onChange={(e) => setFundMonths(Math.max(0, Number(e.target.value)))}
            />
          </Field>
          <Field label={t("annualInflation")} htmlFor="inflation" hint={t("inflationHint")}>
            <PercentInput id="inflation" value={inflation} onChange={setInflation} />
          </Field>
        </CardContent>
      </Card>

      <div>
        <Button type="submit">{t("save")}</Button>
      </div>
    </form>
  );
}
