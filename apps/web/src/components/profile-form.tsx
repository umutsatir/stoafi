"use client";

import { useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { Bucket, Profile } from "@stoafi/core";
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
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>{t("salariesTitle")}</legend>
        <p>{t("salariesHint")}</p>
        {salaries.map((row, index) => {
          const n = index + 1;
          return (
            <div key={row.key}>
              <input
                type="text"
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
                <button
                  type="button"
                  onClick={() => setSalaries((rows) => rows.filter((r) => r.key !== row.key))}
                >
                  {t("removeSalary", { n })}
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setSalaries((rows) => [...rows, { key: newKey(), label: "", monthly: 0 }])}
        >
          {t("addSalary")}
        </button>
      </fieldset>

      <fieldset>
        <legend>{t("expensesTitle")}</legend>
        <p>{t("expensesHint")}</p>
        {expenses.map((row, index) => {
          const n = index + 1;
          return (
            <div key={row.key}>
              <input
                type="text"
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
              <select
                aria-label={t("expenseType", { n })}
                value={row.bucket}
                onChange={(e) => patchExpense(row.key, { bucket: e.target.value as ExpenseBucket })}
              >
                {EXPENSE_BUCKETS.map((bucket) => (
                  <option key={bucket} value={bucket}>
                    {t(bucket === "needs" ? "typeNeed" : "typeWant")}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setExpenses((rows) => rows.filter((r) => r.key !== row.key))}
              >
                {t("removeExpense", { n })}
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() =>
            setExpenses((rows) => [
              ...rows,
              { key: newKey(), label: "", monthly: 0, bucket: "needs" },
            ])
          }
        >
          {t("addExpense")}
        </button>
      </fieldset>

      <div>
        <label htmlFor="living-expenses">{t("livingExpenses")}</label>
        <MoneyInput
          id="living-expenses"
          currency={currency}
          value={livingExpenses}
          onChange={setLivingExpenses}
        />
        <p>{t("livingExpensesHint")}</p>
      </div>

      <div>
        <label htmlFor="savings">{t("currentSavings")}</label>
        <MoneyInput id="savings" currency={currency} value={savings} onChange={setSavings} />
      </div>

      <div>
        <label htmlFor="fund-months">{t("emergencyFundMonths")}</label>
        <input
          id="fund-months"
          type="number"
          min={0}
          step="any"
          value={fundMonths}
          onChange={(e) => setFundMonths(Math.max(0, Number(e.target.value)))}
        />
      </div>

      <div>
        <label htmlFor="inflation">{t("annualInflation")}</label>
        <PercentInput id="inflation" value={inflation} onChange={setInflation} />
        <p>{t("inflationHint")}</p>
      </div>

      <button type="submit">{t("save")}</button>
    </form>
  );
}
