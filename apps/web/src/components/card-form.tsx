"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  BANKS,
  BANKS_ARE_APPROXIMATE,
  CARD_NETWORKS,
  cardColors,
  mainCards,
  supplementariesOf,
  type Card,
  type CardNetwork,
} from "@stoafi/core";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DayOfMonthSelect } from "@/components/ui/day-of-month-select";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { BankCard, useBankName } from "./bank-card";
import { MoneyInput } from "./money-input";

export interface CardFormProps {
  /** The card being edited; omit to add a new one. */
  initial?: Card;
  /** For a new card: make it a supplementary card of this main card. */
  parentId?: string;
  /** For a new card: start with this bank selected. */
  initialBankId?: string;
  /** All cards, to pick a main card for a supplementary one. */
  cards: Card[];
  currency: string;
  createId: () => string;
  onSubmit: (card: Card) => void;
  onCancel: () => void;
}

const NETWORK_LABEL: Record<CardNetwork, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  troy: "Troy",
  amex: "Amex",
  other: "",
};

function BankChoice({
  bankId,
  selected,
  onSelect,
}: {
  bankId: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const bank = BANKS.find((b) => b.id === bankId);
  const name = useBankName(bankId);
  if (!bank) return null;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      style={{ background: `linear-gradient(135deg, ${bank.from}, ${bank.to})`, color: bank.text }}
      className={cn(
        "flex h-12 items-center justify-center rounded-lg px-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected && "ring-2 ring-ring ring-offset-2",
      )}
    >
      {name}
    </button>
  );
}

export function CardForm({
  initial,
  parentId,
  initialBankId,
  cards,
  currency,
  createId,
  onSubmit,
  onCancel,
}: CardFormProps) {
  const t = useTranslations("cards");
  const [bankId, setBankId] = useState(initial?.bankId ?? initialBankId ?? "other");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [kind, setKind] = useState<"main" | "supplementary">(
    initial?.kind ?? (parentId ? "supplementary" : "main"),
  );
  const [parent, setParent] = useState(initial?.parentId ?? parentId ?? "");
  const [statementDay, setStatementDay] = useState(initial?.statementDay ?? 15);
  const [dueDay, setDueDay] = useState(initial?.dueDay ?? 5);
  const [limit, setLimit] = useState(initial?.limit ?? 0);
  const [debt, setDebt] = useState(initial?.currentDebt ?? 0);
  const [last4, setLast4] = useState(initial?.last4 ?? "");
  const [network, setNetwork] = useState<CardNetwork | "">(initial?.network ?? "");
  const [color, setColor] = useState(initial?.color ?? "");
  const [errors, setErrors] = useState<{ label?: boolean; last4?: boolean; parent?: boolean }>({});

  const mains = mainCards(cards).filter((c) => c.id !== initial?.id);
  const supplementary = kind === "supplementary";
  // A main card that has supplementary cards cannot turn into one itself.
  const hasChildren = initial !== undefined && supplementariesOf(cards, initial.id).length > 0;
  const canChangeKind = mains.length > 0 && !hasChildren;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = label.trim();
    const next = {
      label: !trimmed,
      last4: last4 !== "" && !/^\d{4}$/.test(last4),
      parent: supplementary && !parent,
    };
    setErrors(next);
    if (next.label || next.last4 || next.parent) return;

    const card: Card = {
      id: initial?.id ?? createId(),
      label: trimmed,
      statementDay,
      dueDay,
      kind,
      bankId,
      ...(supplementary ? { parentId: parent } : {}),
      ...(!supplementary && limit > 0 ? { limit } : {}),
      ...(debt > 0 ? { currentDebt: debt } : {}),
      ...(last4 ? { last4 } : {}),
      ...(network ? { network } : {}),
      ...(bankId === "other" && color ? { color } : {}),
    };
    onSubmit(card);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <BankCard
        card={{
          label: label.trim() || t("form.previewName"),
          bankId,
          ...(color && bankId === "other" ? { color } : {}),
          ...(network ? { network } : {}),
          ...(last4 && /^\d{4}$/.test(last4) ? { last4 } : {}),
          kind,
        }}
      />

      <div className="flex flex-col gap-1.5">
        <span id="bank-choice-label" className="text-sm font-medium">
          {t("form.bank")}
        </span>
        <div
          role="radiogroup"
          aria-labelledby="bank-choice-label"
          className="grid grid-cols-3 gap-2"
        >
          {BANKS.map((bank) => (
            <BankChoice
              key={bank.id}
              bankId={bank.id}
              selected={bank.id === bankId}
              onSelect={() => setBankId(bank.id)}
            />
          ))}
        </div>
        {BANKS_ARE_APPROXIMATE && (
          <p className="text-xs text-muted-foreground">{t("form.bankHint")}</p>
        )}
      </div>

      {bankId === "other" && (
        <Field label={t("form.color")} htmlFor="card-color">
          <Input
            id="card-color"
            type="color"
            value={color || cardColors({}).from}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-20 p-1"
          />
        </Field>
      )}

      <Field
        label={t("form.label")}
        htmlFor="card-label"
        {...(errors.label ? { error: t("labelRequired") } : {})}
      >
        <Input
          id="card-label"
          value={label}
          aria-invalid={errors.label ? "true" : undefined}
          onChange={(e) => setLabel(e.target.value)}
        />
      </Field>

      {canChangeKind && (
        <Field label={t("form.kind")} htmlFor="card-kind">
          <NativeSelect
            id="card-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value === "supplementary" ? "supplementary" : "main")}
          >
            <option value="main">{t("form.kinds.main")}</option>
            <option value="supplementary">{t("form.kinds.supplementary")}</option>
          </NativeSelect>
        </Field>
      )}

      {supplementary && (
        <Field
          label={t("form.parent")}
          htmlFor="card-parent"
          hint={t("form.parentHint")}
          {...(errors.parent ? { error: t("form.parentRequired") } : {})}
        >
          <NativeSelect id="card-parent" value={parent} onChange={(e) => setParent(e.target.value)}>
            <option value="">{t("form.parentPlaceholder")}</option>
            {mains.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label={t("statementDay")} htmlFor="card-statement-day">
          <DayOfMonthSelect
            id="card-statement-day"
            value={statementDay}
            onChange={setStatementDay}
          />
        </Field>
        <Field label={t("dueDay")} htmlFor="card-due-day">
          <DayOfMonthSelect id="card-due-day" value={dueDay} onChange={setDueDay} />
        </Field>
      </div>

      {!supplementary && (
        <Field label={t("form.limit")} htmlFor="card-limit" hint={t("form.limitHint")}>
          <MoneyInput id="card-limit" currency={currency} value={limit} onChange={setLimit} />
        </Field>
      )}

      <Field label={t("form.currentDebt")} htmlFor="card-debt" hint={t("form.currentDebtHint")}>
        <MoneyInput id="card-debt" currency={currency} value={debt} onChange={setDebt} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label={t("form.last4")}
          htmlFor="card-last4"
          hint={t("form.last4Hint")}
          {...(errors.last4 ? { error: t("form.last4Invalid") } : {})}
        >
          <Input
            id="card-last4"
            inputMode="numeric"
            maxLength={4}
            value={last4}
            aria-invalid={errors.last4 ? "true" : undefined}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="w-24"
          />
        </Field>
        <Field label={t("form.network")} htmlFor="card-network">
          <NativeSelect
            id="card-network"
            value={network}
            onChange={(e) => setNetwork(e.target.value as CardNetwork | "")}
          >
            <option value="">{t("form.networkNone")}</option>
            {CARD_NETWORKS.filter((n) => n !== "other").map((n) => (
              <option key={n} value={n}>
                {NETWORK_LABEL[n]}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("form.cancel")}
        </Button>
        <Button type="submit">{initial ? t("form.save") : t("add")}</Button>
      </div>
    </form>
  );
}
