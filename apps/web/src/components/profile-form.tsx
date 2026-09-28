"use client";

import { useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import {
  INFLATION_COUNTRY_CODES,
  INFLATION_DATA_AS_OF,
  MonthSchema,
  suggestedAnnualInflation,
  suggestedEmergencyFundMonth,
  type Bucket,
  type Month,
  type Profile,
} from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DayOfMonthSelect } from "@/components/ui/day-of-month-select";
import { NativeSelect } from "@/components/ui/native-select";
import { MoneyInput } from "./money-input";
import { PercentInput } from "./percent-input";

export interface ProfileFormProps {
  initial?: Profile;
  currency?: string;
  /** Suggested end month when the user turns an end month on. */
  currentMonth?: Month;
  /** This month's installment payments, taken off the surplus in the emergency-fund estimate. */
  installmentLoad?: number;
  onSave: (profile: Profile) => void | Promise<void>;
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

export function ProfileForm({
  initial,
  currency = "TRY",
  currentMonth,
  installmentLoad = 0,
  onSave,
}: ProfileFormProps) {
  const t = useTranslations("profile");
  const locale = useLocale();
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
  const [savings, setSavings] = useState(initial?.savings ?? 0);
  const [fundMonths, setFundMonths] = useState(initial?.emergencyFundTargetMonths ?? 6);
  const [inflation, setInflation] = useState(initial?.annualInflationExpectation ?? 0.3);
  const [country, setCountry] = useState("");

  const regionNames = new Intl.DisplayNames(locale, { type: "region" });

  // Live estimate from what is on screen, not only what was last saved.
  const monthlyIncome = salaries.reduce((sum, r) => sum + r.monthly, 0);
  const activeExpenses = expenses.filter((r) => {
    const end = MonthSchema.safeParse(r.endMonth);
    return !currentMonth || !end.success || end.data >= currentMonth;
  });
  const monthlyNeeds =
    activeExpenses.filter((r) => r.bucket === "needs").reduce((sum, r) => sum + r.monthly, 0) +
    livingExpenses;
  const monthlySurplus =
    monthlyIncome -
    activeExpenses.reduce((sum, r) => sum + r.monthly, 0) -
    livingExpenses -
    installmentLoad;
  const targetAmount = Math.round(monthlyNeeds * fundMonths);
  const completionMonth = currentMonth
    ? suggestedEmergencyFundMonth(savings, monthlyNeeds, fundMonths, monthlySurplus, currentMonth)
    : undefined;

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
            {currentMonth && (
              <p data-testid="emergency-fund-caption" className="text-xs text-muted-foreground">
                {savings >= targetAmount
                  ? t("emergencyFundReached")
                  : completionMonth
                    ? t("emergencyFundOnTrack", { month: completionMonth })
                    : t("emergencyFundUnreachable")}
              </p>
            )}
          </Field>
          <Field label={t("country")} htmlFor="country">
            <NativeSelect
              id="country"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                const rate = suggestedAnnualInflation(e.target.value);
                if (rate !== undefined) setInflation(rate);
              }}
            >
              <option value="">{t("countryPlaceholder")}</option>
              {INFLATION_COUNTRY_CODES.map((code) => (
                <option key={code} value={code}>
                  {regionNames.of(code) ?? code}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field
            label={t("annualInflation")}
            htmlFor="inflation"
            hint={
              country
                ? t("suggestedInflationCaption", { asOf: INFLATION_DATA_AS_OF })
                : t("inflationHint")
            }
          >
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
