"use client";

import { useTranslations } from "next-intl";
import { limitUsage, supplementariesOf, type Card } from "@stoafi/core";
import { Card as Surface } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { ProgressBar } from "@/components/ui/progress-bar";

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
  const fact = "rounded-[20px] bg-muted px-[18px] py-3.5";
  const pill = "press rounded-full bg-muted px-[18px] py-[11px] text-[13px] font-bold";

  return (
    <Surface className="pop-in px-8 py-7" data-testid="card-detail">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[22px] font-extrabold tracking-[-0.03em]">{card.label}</h2>
        {supplementary && main && (
          <span className="text-[12.5px] font-bold text-muted-foreground">
            {t("detail.sharesLimitOf")}: {main.label}
          </span>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className={fact}>
          <dt className="text-xs font-bold text-muted-foreground">{t("statementDay")}</dt>
          <dd className="mt-0.5 text-[17px] font-extrabold">
            {t("dayValue", { day: card.statementDay })}
          </dd>
        </div>
        <div className={fact}>
          <dt className="text-xs font-bold text-muted-foreground">{t("dueDay")}</dt>
          <dd className="mt-0.5 text-[17px] font-extrabold">
            {t("dayValue", { day: card.dueDay })}
          </dd>
        </div>
      </dl>

      {usage ? (
        <section className="mt-[22px]" aria-label={t("detail.limitSection")}>
          <div className="flex flex-wrap justify-between gap-2 text-[13.5px] font-bold">
            <span>
              {t("detail.limitUsed")}{" "}
              <span data-testid="limit-used-text">
                <b>
                  <Money value={usage.used} />
                </b>{" "}
                / <Money value={usage.limit} />
              </span>
            </span>
            <span
              data-testid="limit-available"
              className={usage.overLimit ? "text-destructive" : "text-success"}
            >
              {usage.overLimit
                ? t("detail.overLimit", { amount: usage.used - usage.limit })
                : t("detail.available")}{" "}
              {!usage.overLimit && <Money value={usage.available} />}
            </span>
          </div>
          <ProgressBar
            value={usage.used}
            max={usage.limit}
            label={t("detail.limitBar")}
            tone={
              usage.overLimit ? "danger" : usage.used / usage.limit > 0.8 ? "warning" : "danger"
            }
            className="mt-2 h-3"
          />
          {supplementary && (
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
              {t("detail.sharedNote")}
            </p>
          )}
        </section>
      ) : (
        !supplementary && (
          <p className="mt-5 text-sm text-muted-foreground">{t("detail.noLimit")}</p>
        )
      )}

      <div className="mt-5 flex items-center justify-between gap-2 text-[13.5px] font-bold">
        <span>{t("detail.owedHere")}</span>
        <span data-testid="owed-here">
          <Money value={owed} />
        </span>
      </div>

      {extras.length > 0 && (
        <section className="mt-5">
          <h3 className="text-sm font-extrabold">{t("detail.supplementaryTitle")}</h3>
          <ul className="mt-1 text-sm text-muted-foreground">
            {extras.map((e) => (
              <li key={e.id}>
                {e.label} · {t("dayValue", { day: e.dueDay })}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className={pill} onClick={onEdit}>
          {t("edit")}
        </button>
        {!supplementary && (
          <button type="button" className={pill} onClick={onAddSupplementary}>
            {t("addSupplementary")}
          </button>
        )}
        <button type="button" className={pill} onClick={onMinimumOnly}>
          {t("onlyMinimum")}
        </button>
        <button
          type="button"
          aria-label={t("delete", { name: card.label })}
          className={`${pill} text-destructive`}
          onClick={onDelete}
        >
          {t("deleteShort")}
        </button>
      </div>
    </Surface>
  );
}
