"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { QueueItem } from "@stoafi/core";
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

  return (
    <form onSubmit={handleSubmit} aria-label={initial ? t("editTitle") : t("addTitle")}>
      <h2>{initial ? t("editTitle") : t("addTitle")}</h2>

      <label htmlFor="queue-name">{t("name")}</label>
      <input
        id="queue-name"
        type="text"
        value={name}
        aria-invalid={error === "name" ? "true" : undefined}
        onChange={(e) => setName(e.target.value)}
      />
      {error === "name" && <p role="alert">{t("nameRequired")}</p>}

      <label htmlFor="queue-price">{t("price")}</label>
      <MoneyInput id="queue-price" currency={currency} value={price} onChange={setPrice} />
      {error === "price" && <p role="alert">{t("priceRequired")}</p>}

      <label htmlFor="queue-cash-price">{t("cashPrice")}</label>
      <MoneyInput
        id="queue-cash-price"
        currency={currency}
        value={cashPrice}
        onChange={setCashPrice}
      />

      <label htmlFor="queue-kind">{t("kind")}</label>
      <select
        id="queue-kind"
        value={isNeed ? "need" : "want"}
        onChange={(e) => setIsNeed(e.target.value === "need")}
      >
        <option value="want">{t("kindWant")}</option>
        <option value="need">{t("kindNeed")}</option>
      </select>

      <label htmlFor="queue-urgency">{t("urgency")}</label>
      <select
        id="queue-urgency"
        value={urgency}
        onChange={(e) => setUrgency(Number(e.target.value))}
      >
        {LEVELS.map((level) => (
          <option key={level} value={level}>
            {t(`level${level}`)}
          </option>
        ))}
      </select>

      <label htmlFor="queue-importance">{t("importanceLabel")}</label>
      <select
        id="queue-importance"
        value={importance}
        onChange={(e) => setImportance(Number(e.target.value))}
      >
        {LEVELS.map((level) => (
          <option key={level} value={level}>
            {t(`level${level}`)}
          </option>
        ))}
      </select>

      <label htmlFor="queue-uses">{t("expectedUses")}</label>
      <input
        id="queue-uses"
        type="number"
        min={1}
        step={1}
        value={expectedUses}
        onChange={(e) => setExpectedUses(Math.max(1, Math.floor(Number(e.target.value)) || 1))}
      />

      <button type="submit">{initial ? t("saveChanges") : t("add")}</button>
      {onCancel && (
        <button type="button" onClick={onCancel}>
          {t("cancel")}
        </button>
      )}
    </form>
  );
}
