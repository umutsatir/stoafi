"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { QueueItem } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { MoneyInput } from "./money-input";

export interface QueueFormProps {
  /** Present when editing; absent when adding. */
  initial?: QueueItem;
  today: string;
  /** `order` for a newly added item (end of the queue). */
  nextOrder: number;
  createId: () => string;
  currency?: string;
  onSubmit: (item: QueueItem) => void;
  onCancel?: () => void;
}

const LEVELS = [1, 2, 3] as const;

export function QueueForm({
  initial,
  today,
  nextOrder,
  createId,
  currency = "TRY",
  onSubmit,
  onCancel,
}: QueueFormProps) {
  const t = useTranslations("queue");
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [cashPrice, setCashPrice] = useState(initial?.discountedCashPrice ?? 0);
  const [isNeed, setIsNeed] = useState(initial?.isNeed ?? false);
  const [urgency, setUrgency] = useState(initial?.urgency ?? 2);
  const [importance, setImportance] = useState(initial?.importance ?? 2);
  const [expectedUses, setExpectedUses] = useState(initial?.expectedUses ?? 1);
  const [error, setError] = useState<"name" | "price" | null>(null);

  function reset() {
    setName("");
    setPrice(0);
    setCashPrice(0);
    setIsNeed(false);
    setUrgency(2);
    setImportance(2);
    setExpectedUses(1);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === "") return setError("name");
    if (price <= 0) return setError("price");
    setError(null);

    onSubmit({
      ...(initial?.installmentOffers ? { installmentOffers: initial.installmentOffers } : {}),
      id: initial?.id ?? createId(),
      name: trimmed,
      price,
      ...(cashPrice > 0 ? { discountedCashPrice: cashPrice } : {}),
      urgency,
      importance,
      isNeed,
      expectedUses,
      addedDate: initial?.addedDate ?? today,
      priceUpdatedDate: !initial || initial.price !== price ? today : initial.priceUpdatedDate,
      order: initial?.order ?? nextOrder,
    });
    if (!initial) reset();
  }

  const title = initial ? t("editTitle") : t("addTitle");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} aria-label={title} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t("name")}
              htmlFor="queue-name"
              error={error === "name" ? t("nameRequired") : undefined}
            >
              <Input
                id="queue-name"
                type="text"
                value={name}
                aria-invalid={error === "name" ? "true" : undefined}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label={t("kind")} htmlFor="queue-kind">
              <NativeSelect
                id="queue-kind"
                value={isNeed ? "need" : "want"}
                onChange={(e) => setIsNeed(e.target.value === "need")}
              >
                <option value="want">{t("kindWant")}</option>
                <option value="need">{t("kindNeed")}</option>
              </NativeSelect>
            </Field>
            <Field
              label={t("price")}
              htmlFor="queue-price"
              error={error === "price" ? t("priceRequired") : undefined}
            >
              <MoneyInput id="queue-price" currency={currency} value={price} onChange={setPrice} />
            </Field>
            <Field label={t("cashPrice")} htmlFor="queue-cash-price">
              <MoneyInput
                id="queue-cash-price"
                currency={currency}
                value={cashPrice}
                onChange={setCashPrice}
              />
            </Field>
            <Field label={t("urgency")} htmlFor="queue-urgency">
              <NativeSelect
                id="queue-urgency"
                value={urgency}
                onChange={(e) => setUrgency(Number(e.target.value))}
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {t(`level${level}`)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t("importanceLabel")} htmlFor="queue-importance">
              <NativeSelect
                id="queue-importance"
                value={importance}
                onChange={(e) => setImportance(Number(e.target.value))}
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {t(`level${level}`)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t("expectedUses")} htmlFor="queue-uses">
              <Input
                id="queue-uses"
                type="number"
                min={1}
                step={1}
                value={expectedUses}
                onChange={(e) =>
                  setExpectedUses(Math.max(1, Math.floor(Number(e.target.value)) || 1))
                }
              />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button type="submit">{initial ? t("saveChanges") : t("add")}</Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t("cancel")}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
