"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { limitUsage, supplementariesOf, type Card } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { ProgressBar } from "@/components/ui/progress-bar";
import { BankCard } from "./bank-card";

export interface CardDetailProps {
  card: Card;
  cards: Card[];
  /** What is still to be paid on installment purchases, per card id. */
  remainingInstallments: Record<string, number>;
  onEdit: () => void;
  onDelete: () => void;
  onAddSupplementary: () => void;
  onMinimumOnly: () => void;
}

function Fact({ label, value, testId }: { label: string; value: ReactNode; testId?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium" data-testid={testId}>
        {value}
      </dd>
    </div>
  );
}

export function CardDetail({
  card,
  cards,
  remainingInstallments,
  onEdit,
  onDelete,
  onAddSupplementary,
  onMinimumOnly,
}: CardDetailProps) {
  const t = useTranslations("cards");
  const supplementary = card.kind === "supplementary";
  const main = supplementary ? cards.find((c) => c.id === card.parentId) : card;
  const usage = main ? limitUsage(cards, main.id, remainingInstallments) : null;
  const extras = supplementary ? [] : supplementariesOf(cards, card.id);
  const owed = (card.currentDebt ?? 0) + (remainingInstallments[card.id] ?? 0);

  return (
    <div className="flex flex-col gap-4" data-testid="card-detail">
      <BankCard card={card} />

      <dl className="divide-y divide-border">
        <Fact label={t("statementDay")} value={t("dayValue", { day: card.statementDay })} />
        <Fact label={t("dueDay")} value={t("dayValue", { day: card.dueDay })} />
        {supplementary && main && <Fact label={t("detail.sharesLimitOf")} value={main.label} />}
      </dl>

      {usage ? (
        <section className="flex flex-col gap-2" aria-label={t("detail.limitSection")}>
          <p className="text-sm font-medium">
            {t("detail.limitUsed")}{" "}
            <span data-testid="limit-used-text">
              <Money value={usage.used} /> / <Money value={usage.limit} />
            </span>
          </p>
          <ProgressBar
            value={usage.used}
            max={usage.limit}
            label={t("detail.limitBar")}
            tone={
              usage.overLimit ? "danger" : usage.used / usage.limit > 0.8 ? "warning" : "primary"
            }
          />
          <p
            data-testid="limit-available"
            className={
              usage.overLimit
                ? "text-sm font-medium text-destructive"
                : "text-sm text-muted-foreground"
            }
          >
            {usage.overLimit
              ? t("detail.overLimit", { amount: usage.used - usage.limit })
              : t("detail.available")}{" "}
            {!usage.overLimit && <Money value={usage.available} />}
          </p>
          {supplementary && (
            <p className="text-xs text-muted-foreground">{t("detail.sharedNote")}</p>
          )}
        </section>
      ) : (
        !supplementary && <p className="text-sm text-muted-foreground">{t("detail.noLimit")}</p>
      )}

      <dl className="divide-y divide-border">
        <Fact label={t("detail.owedHere")} value={<Money value={owed} />} testId="owed-here" />
      </dl>

      {extras.length > 0 && (
        <section className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">{t("detail.supplementaryTitle")}</h3>
          <ul className="text-sm text-muted-foreground">
            {extras.map((e) => (
              <li key={e.id}>
                {e.label} · {t("dayValue", { day: e.dueDay })}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onEdit}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
          {t("edit")}
        </Button>
        {!supplementary && (
          <Button type="button" variant="outline" onClick={onAddSupplementary}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("addSupplementary")}
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onMinimumOnly}>
          {t("onlyMinimum")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          aria-label={t("delete", { name: card.label })}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {t("deleteShort")}
        </Button>
      </div>
    </div>
  );
}
