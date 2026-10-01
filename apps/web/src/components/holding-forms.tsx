"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { INVESTMENT_TYPES, type Holding, type Trade } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { parseQuantity } from "@/lib/amount-text";
import { cn } from "@/lib/utils";
import { picturesFor } from "./investment-icons";
import { MoneyInput } from "./money-input";

interface BaseProps {
  today: string;
  currency: string;
  createId: () => string;
  onCancel: () => void;
}

export interface TradeFormProps extends BaseProps {
  holdingLabel: string;
  unitLabel?: string;
  /** What is held now; a sale cannot be larger. */
  held: number;
  onSubmit: (trade: Trade) => void;
}

/** Record a purchase or a sale of something already owned. */
export function TradeForm({
  today,
  currency,
  createId,
  onCancel,
  held,
  unitLabel,
  onSubmit,
}: TradeFormProps) {
  const t = useTranslations("investments.trade");
  const locale = useLocale();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantityText, setQuantityText] = useState("");
  const [unitPrice, setUnitPrice] = useState(0);
  const [fee, setFee] = useState(0);
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [error, setError] = useState<"quantity" | "price" | "held" | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const quantity = parseQuantity(quantityText, locale);
    if (quantity === null) return setError("quantity");
    if (unitPrice <= 0) return setError("price");
    if (side === "sell" && quantity > held + 1e-9) return setError("held");
    setError(null);
    onSubmit({
      id: createId(),
      date,
      side,
      quantity,
      unitPrice,
      ...(fee > 0 ? { fee } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <SegmentedControl
        label={t("side")}
        value={side}
        onChange={setSide}
        options={[
          { value: "buy", label: t("buy") },
          { value: "sell", label: t("sell") },
        ]}
      />
      <Field
        label={unitLabel ? t("quantityUnit", { unit: unitLabel }) : t("quantity")}
        htmlFor="trade-quantity"
        {...(error === "quantity" ? { error: t("quantityRequired") } : {})}
        {...(error === "held" ? { error: t("tooMany") } : {})}
      >
        <Input
          id="trade-quantity"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={quantityText}
          aria-invalid={error === "quantity" || error === "held" ? "true" : undefined}
          onChange={(e) => setQuantityText(e.target.value)}
          className="w-40"
        />
      </Field>
      <Field
        label={t("unitPrice")}
        htmlFor="trade-price"
        {...(error === "price" ? { error: t("priceRequired") } : {})}
      >
        <MoneyInput
          id="trade-price"
          currency={currency}
          value={unitPrice}
          onChange={setUnitPrice}
        />
      </Field>
      <Field label={t("fee")} htmlFor="trade-fee" hint={t("feeHint")}>
        <MoneyInput id="trade-fee" currency={currency} value={fee} onChange={setFee} />
      </Field>
      <Field label={t("date")} htmlFor="trade-date">
        <Input
          id="trade-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-44"
        />
      </Field>
      <Field label={t("note")} htmlFor="trade-note">
        <Input id="trade-note" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="submit">{side === "buy" ? t("submitBuy") : t("submitSell")}</Button>
      </div>
    </form>
  );
}

export interface PriceFormProps extends BaseProps {
  holding: Holding;
  onSubmit: (price: number, date: string) => void;
}

/** Type in what one unit is worth now. The app never looks prices up. */
export function PriceForm({ today, currency, onCancel, holding, onSubmit }: PriceFormProps) {
  const t = useTranslations("investments.price");
  const [price, setPrice] = useState(holding.currentPrice ?? 0);
  const [date, setDate] = useState(today);
  const [error, setError] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (price <= 0) return setError(true);
        onSubmit(price, date);
      }}
      className="flex flex-col gap-4"
    >
      <p className="text-sm text-muted-foreground">{t("hint")}</p>
      <Field label={t("price")} htmlFor="price-value" {...(error ? { error: t("required") } : {})}>
        <MoneyInput id="price-value" currency={currency} value={price} onChange={setPrice} />
      </Field>
      <Field label={t("date")} htmlFor="price-date">
        <Input
          id="price-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-44"
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="submit">{t("save")}</Button>
      </div>
    </form>
  );
}

export interface HoldingFormProps extends BaseProps {
  onSubmit: (holding: Holding) => void;
  initialTypeId?: string;
}

/** Add something you own: pick a type (or make your own), name it, optionally record the first purchase. */
export function HoldingForm({
  today,
  currency,
  createId,
  onCancel,
  onSubmit,
  initialTypeId,
}: HoldingFormProps) {
  const t = useTranslations("investments.add");
  const tTypes = useTranslations("investments.types");
  const locale = useLocale();
  const [typeId, setTypeId] = useState(initialTypeId ?? "gold");
  const [customType, setCustomType] = useState("");
  const [label, setLabel] = useState("");
  const [unitLabel, setUnitLabel] = useState("");
  const [quantityText, setQuantityText] = useState("");
  const [unitPrice, setUnitPrice] = useState(0);
  const [date, setDate] = useState(today);
  const [error, setError] = useState<"label" | "custom" | "quantity" | "price" | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!label.trim()) return setError("label");
    if (typeId === "custom" && !customType.trim()) return setError("custom");
    const hasPurchase = quantityText.trim() !== "" || unitPrice > 0;
    const quantity = parseQuantity(quantityText, locale);
    if (hasPurchase && quantity === null) return setError("quantity");
    if (hasPurchase && unitPrice <= 0) return setError("price");
    setError(null);
    onSubmit({
      id: createId(),
      label: label.trim(),
      typeId,
      ...(typeId === "custom" ? { customType: customType.trim() } : {}),
      ...(unitLabel.trim() ? { unitLabel: unitLabel.trim() } : {}),
      ...(hasPurchase && quantity !== null
        ? {
            currentPrice: unitPrice,
            priceDate: date,
          }
        : {}),
      trades:
        hasPurchase && quantity !== null
          ? [{ id: createId(), date, side: "buy", quantity, unitPrice }]
          : [],
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span id="type-choice-label" className="text-sm font-medium">
          {t("type")}
        </span>
        <div
          role="radiogroup"
          aria-labelledby="type-choice-label"
          className="grid grid-cols-2 gap-2"
        >
          {[...INVESTMENT_TYPES.map((type) => type.id), "custom"].map((id) => {
            const Icon = picturesFor(id).pot;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={typeId === id}
                onClick={() => setTypeId(id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  typeId === id ? "border-primary bg-primary/10 font-medium" : "border-border",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {id === "custom" ? t("customType") : tTypes(`${id}.name`)}
              </button>
            );
          })}
        </div>
      </div>
      {typeId === "custom" && (
        <Field
          label={t("customName")}
          htmlFor="holding-custom"
          {...(error === "custom" ? { error: t("customRequired") } : {})}
        >
          <Input
            id="holding-custom"
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
          />
        </Field>
      )}
      <Field
        label={t("name")}
        htmlFor="holding-name"
        hint={t("nameHint")}
        {...(error === "label" ? { error: t("nameRequired") } : {})}
      >
        <Input id="holding-name" value={label} onChange={(e) => setLabel(e.target.value)} />
      </Field>
      <Field label={t("unit")} htmlFor="holding-unit" hint={t("unitHint")}>
        <Input
          id="holding-unit"
          value={unitLabel}
          onChange={(e) => setUnitLabel(e.target.value)}
          className="w-32"
        />
      </Field>
      <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium">{t("firstPurchase")}</legend>
        <Field
          label={t("quantity")}
          htmlFor="holding-quantity"
          {...(error === "quantity" ? { error: t("quantityRequired") } : {})}
        >
          <Input
            id="holding-quantity"
            inputMode="decimal"
            autoComplete="off"
            value={quantityText}
            onChange={(e) => setQuantityText(e.target.value)}
            className="w-40"
          />
        </Field>
        <Field
          label={t("unitPrice")}
          htmlFor="holding-price"
          {...(error === "price" ? { error: t("priceRequired") } : {})}
        >
          <MoneyInput
            id="holding-price"
            currency={currency}
            value={unitPrice}
            onChange={setUnitPrice}
          />
        </Field>
        <Field label={t("date")} htmlFor="holding-date">
          <Input
            id="holding-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </Field>
      </fieldset>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="submit">{t("submit")}</Button>
      </div>
    </form>
  );
}
