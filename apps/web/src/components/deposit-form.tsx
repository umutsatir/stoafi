"use client";

import { useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MoneyInput } from "./money-input";

export interface DepositFormProps {
  today: string;
  currency: string;
  /** Amounts offered as one-tap chips, in minor units. */
  quickAmounts: number[];
  /** What is in the pot; a withdrawal cannot be larger. */
  balance: number;
  createId: () => string;
  onSubmit: (deposit: { id: string; date: string; amount: number; note?: string }) => void;
  onCancel: () => void;
}

/** Put money into a pot or take some out. A withdrawal is sent as a negative amount. */
export function DepositForm({
  today,
  currency,
  quickAmounts,
  balance,
  createId,
  onSubmit,
  onCancel,
}: DepositFormProps) {
  const t = useTranslations("savings.deposit");
  const format = useFormatter();
  const [mode, setMode] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [error, setError] = useState<"amount" | "balance" | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (amount <= 0) return setError("amount");
    if (mode === "out" && amount > balance) return setError("balance");
    setError(null);
    onSubmit({
      id: createId(),
      date,
      amount: mode === "in" ? amount : -amount,
      ...(note.trim() ? { note: note.trim() } : {}),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <SegmentedControl
        label={t("mode")}
        value={mode}
        onChange={setMode}
        options={[
          { value: "in", label: t("modeIn") },
          { value: "out", label: t("modeOut") },
        ]}
      />
      <Field
        label={t("amount")}
        htmlFor="deposit-amount"
        {...(error === "amount" ? { error: t("amountRequired") } : {})}
        {...(error === "balance" ? { error: t("tooMuch") } : {})}
      >
        <MoneyInput id="deposit-amount" currency={currency} value={amount} onChange={setAmount} />
      </Field>
      {mode === "in" && quickAmounts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickAmounts.map((quick) => (
            <Button
              key={quick}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAmount(quick)}
            >
              {format.number(quick / 100, {
                style: "currency",
                currency,
                currencyDisplay: "narrowSymbol",
                maximumFractionDigits: 0,
              })}
            </Button>
          ))}
        </div>
      )}
      <Field label={t("date")} htmlFor="deposit-date">
        <Input
          id="deposit-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-44"
        />
      </Field>
      <Field label={t("note")} htmlFor="deposit-note">
        <Input id="deposit-note" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="submit">{mode === "in" ? t("submitIn") : t("submitOut")}</Button>
      </div>
    </form>
  );
}
