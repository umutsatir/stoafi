"use client";

import { useTranslations } from "next-intl";
import { cardColors, supplementariesOf, type Card } from "@stoafi/core";
import { BankCard } from "./bank-card";

export interface CardStackProps {
  main: Card;
  cards: Card[];
  onOpen: (card: Card) => void;
}

/** A main card with its supplementary cards tucked underneath, like cards in a wallet. */
export function CardStack({ main, cards, onOpen }: CardStackProps) {
  const t = useTranslations("cards");
  const extras = supplementariesOf(cards, main.id);

  return (
    <div data-testid={`card-${main.id}`} className="flex w-full max-w-sm flex-col">
      <BankCard
        card={main}
        onClick={() => onOpen(main)}
        ariaLabel={t("openCard", { name: main.label })}
        className="z-30"
      />
      {extras.map((extra, index) => {
        const colors = cardColors(extra);
        return (
          <button
            key={extra.id}
            type="button"
            data-testid={`card-${extra.id}`}
            onClick={() => onOpen(extra)}
            aria-label={t("openSupplementary", { name: extra.label, main: main.label })}
            style={{
              background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
              color: colors.text,
              zIndex: 20 - index,
            }}
            className="-mt-8 flex h-16 items-end justify-between rounded-b-2xl px-5 pb-2 text-left text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="truncate">{extra.label}</span>
            <span className="text-xs opacity-90">{t("supplementaryBadge")}</span>
          </button>
        );
      })}
    </div>
  );
}
