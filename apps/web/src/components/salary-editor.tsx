"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { Profile } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { DayOfMonthSelect } from "@/components/ui/day-of-month-select";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "./money-input";

export type SalaryValue = Profile["incomes"][number];

export interface SalaryEditorProps {
  initial?: SalaryValue;
  currency: string;
  onSave: (salary: SalaryValue) => void;
  onCancel: () => void;
}

/** Add or change one income: a name, what comes in each month and the day it arrives. */
export function SalaryEditor({ initial, currency, onSave, onCancel }: SalaryEditorProps) {
  const t = useTranslations("profile.salary");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [monthly, setMonthly] = useState(initial?.monthly ?? 0);
  const [payDay, setPayDay] = useState<number | undefined>(initial?.payDay);
  const [errors, setErrors] = useState<string[]>([]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // This form sits in a portal inside the page form in the React tree; do not submit that one too.
    event.stopPropagation();
    const found: string[] = [];
    if (label.trim() === "") found.push("nameRequired");
    if (monthly <= 0) found.push("amountRequired");
    setErrors(found);
    if (found.length > 0) return;
    onSave({
      label: label.trim(),
      monthly,
      ...(payDay !== undefined ? { payDay } : {}),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <Field
        label={t("name")}
        htmlFor="salary-name"
        {...(errors.includes("nameRequired") ? { error: t("nameRequired") } : {})}
      >
        <Input
          id="salary-name"
          value={label}
          placeholder={t("example")}
          onChange={(e) => setLabel(e.target.value)}
        />
      </Field>
      <Field
        label={t("amount")}
        htmlFor="salary-amount"
        hint={t("amountHint")}
        {...(errors.includes("amountRequired") ? { error: t("amountRequired") } : {})}
      >
        <MoneyInput id="salary-amount" currency={currency} value={monthly} onChange={setMonthly} />
      </Field>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="salary-day" className="text-sm font-medium">
          {t("payDay")}
        </label>
        <DayOfMonthSelect id="salary-day" value={payDay ?? 1} onChange={setPayDay} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">{initial ? t("saveChanges") : t("add")}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
