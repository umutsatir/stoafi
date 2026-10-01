"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CreditCard, Landmark, PiggyBank, Receipt, type LucideIcon } from "lucide-react";
import {
  addMonths,
  expenseKind,
  remainingPayments,
  type Bucket,
  type Card,
  type Month,
  type Profile,
} from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { DayOfMonthSelect } from "@/components/ui/day-of-month-select";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatMonth } from "@/lib/format-month";
import { cn } from "@/lib/utils";
import { MoneyInput } from "./money-input";

export type ExpenseValue = Profile["fixedExpenses"][number];

/** The four things the user picks from. "saving" is a regular line that goes to savings or investing. */
export type ExpenseTile = "regular" | "installment" | "loan" | "saving";

const TILES: { id: ExpenseTile; icon: LucideIcon }[] = [
  { id: "regular", icon: Receipt },
  { id: "installment", icon: CreditCard },
  { id: "loan", icon: Landmark },
  { id: "saving", icon: PiggyBank },
];

/** Which tile a saved line belongs to. */
export function tileOf(expense: ExpenseValue): ExpenseTile {
  const kind = expenseKind(expense);
  if (kind !== "regular") return kind;
  return expense.bucket === "savings" || expense.bucket === "investing" ? "saving" : "regular";
}

export interface ExpenseEditorProps {
  /** The line being edited; omitted when adding. */
  initial?: ExpenseValue;
  currency: string;
  currentMonth: Month;
  /** Cards an installment can be put on; the choice is only offered when there are some. */
  cards?: Card[];
  onSave: (expense: ExpenseValue) => void;
  onCancel: () => void;
}

/** Add or change one recurring line: pick its type first, then only the fields that type needs. */
export function ExpenseEditor({
  initial,
  currency,
  currentMonth,
  cards = [],
  onSave,
  onCancel,
}: ExpenseEditorProps) {
  const t = useTranslations("profile.expense");
  const locale = useLocale();
  const [tile, setTile] = useState<ExpenseTile>(initial ? tileOf(initial) : "regular");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [monthly, setMonthly] = useState(initial?.monthly ?? 0);
  const [bucket, setBucket] = useState<Bucket>(initial?.bucket ?? "needs");
  const [dueDay, setDueDay] = useState<number | undefined>(initial?.dueDay);
  const [remaining, setRemaining] = useState(
    initial ? (remainingPayments(initial, currentMonth) ?? 1) : 6,
  );
  const [hasEnd, setHasEnd] = useState(
    initial?.endMonth !== undefined && tileOf(initial) === "regular",
  );
  const [endMonth, setEndMonth] = useState(initial?.endMonth ?? currentMonth);
  const [cardId, setCardId] = useState(initial?.cardId ?? "");
  const [errors, setErrors] = useState<string[]>([]);

  const owed = tile === "installment" || tile === "loan";
  // The bucket choices change with the type: need or want for costs, saving or investing for transfers.
  const bucketOptions: Bucket[] = tile === "saving" ? ["savings", "investing"] : ["needs", "wants"];
  const effectiveBucket: Bucket = bucketOptions.includes(bucket)
    ? bucket
    : (bucketOptions[0] as Bucket);
  const lastPayment = addMonths(currentMonth, Math.max(1, remaining) - 1);

  function pick(next: ExpenseTile) {
    setTile(next);
    setErrors([]);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // This form sits in a portal inside the page form in the React tree; do not submit that one too.
    event.stopPropagation();
    const found: string[] = [];
    if (label.trim() === "") found.push("nameRequired");
    if (monthly <= 0) found.push("amountRequired");
    if (owed && (!Number.isInteger(remaining) || remaining < 1)) found.push("remainingRequired");
    setErrors(found);
    if (found.length > 0) return;

    const end = owed
      ? lastPayment
      : hasEnd && /^\d{4}-\d{2}$/.test(endMonth)
        ? (endMonth as Month)
        : undefined;
    onSave({
      label: label.trim(),
      monthly,
      bucket: effectiveBucket,
      ...(owed ? { kind: tile } : {}),
      ...(tile === "installment" && cardId ? { cardId } : {}),
      ...(dueDay !== undefined ? { dueDay } : {}),
      ...(end ? { endMonth: end } : {}),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("typeTitle")}</span>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("typeTitle")}>
          {TILES.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={tile === id}
              onClick={() => pick(id)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                tile === id ? "border-primary bg-primary/10" : "border-border bg-card",
              )}
            >
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="text-sm font-semibold">{t(`kind.${id}.title`)}</span>
              <span className="text-xs text-muted-foreground">{t(`kind.${id}.hint`)}</span>
            </button>
          ))}
        </div>
      </div>

      <Field
        label={t("name")}
        htmlFor="expense-name"
        {...(errors.includes("nameRequired") ? { error: t("nameRequired") } : {})}
      >
        <Input
          id="expense-name"
          value={label}
          placeholder={t(`kind.${tile}.example`)}
          onChange={(e) => setLabel(e.target.value)}
        />
      </Field>

      <Field
        label={owed ? t("paymentAmount") : t("amount")}
        htmlFor="expense-amount"
        {...(errors.includes("amountRequired") ? { error: t("amountRequired") } : {})}
      >
        <MoneyInput id="expense-amount" currency={currency} value={monthly} onChange={setMonthly} />
      </Field>

      {owed && (
        <Field
          label={t("remaining")}
          htmlFor="expense-remaining"
          hint={t("remainingHint", { month: formatMonth(lastPayment, locale) })}
          {...(errors.includes("remainingRequired") ? { error: t("remainingRequired") } : {})}
        >
          <Input
            id="expense-remaining"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            className="w-28"
            value={Number.isFinite(remaining) ? remaining : ""}
            onChange={(e) =>
              setRemaining(e.target.value === "" ? Number.NaN : Number(e.target.value))
            }
          />
        </Field>
      )}

      {tile === "installment" && cards.length > 0 && (
        <Field label={t("card")} htmlFor="expense-card" hint={t("cardHint")}>
          <select
            id="expense-card"
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            className="h-9 rounded-md border border-input bg-card px-3 text-sm"
          >
            <option value="">{t("noCard")}</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            {tile === "saving" ? t("whereTo") : t("importance")}
          </span>
          <SegmentedControl
            label={tile === "saving" ? t("whereTo") : t("importance")}
            value={effectiveBucket}
            onChange={setBucket}
            options={bucketOptions.map((b) => ({ value: b, label: t(`bucket.${b}`) }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="expense-due" className="text-sm font-medium">
            {t("dueDay")}
          </label>
          <DayOfMonthSelect id="expense-due" value={dueDay ?? 1} onChange={setDueDay} />
        </div>
      </div>

      {!owed && (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasEnd} onChange={(e) => setHasEnd(e.target.checked)} />
            {t("hasEnd")}
          </label>
          {hasEnd && (
            <Input
              type="month"
              className="w-44"
              aria-label={t("endMonth")}
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value as Month)}
            />
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit">{initial ? t("saveChanges") : t("add")}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
