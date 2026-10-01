"use client";

import { ChevronRight } from "lucide-react";
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
            className="group -mt-8 flex h-16 cursor-pointer items-end justify-between rounded-b-2xl px-5 pb-2 text-left text-sm font-medium shadow-sm transition-all duration-200 hover:translate-y-1.5 hover:shadow-lg hover:brightness-110 focus-visible:translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="truncate group-hover:underline">{extra.label}</span>
            <span className="flex items-center gap-1 text-xs opacity-90">
              {t("supplementaryBadge")}
              <ChevronRight
                className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
