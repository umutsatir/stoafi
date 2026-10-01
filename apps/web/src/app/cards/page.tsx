"use client";

import { useTranslations } from "next-intl";
import { CardList } from "@/components/card-list";
import { MinimumPaymentCalculator } from "@/components/minimum-payment-calculator";
import { removeCard, saveCard } from "@/storage/card-repo";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";
import { Page } from "@/components/ui/page";
import { notify, notifyUndo } from "@/components/ui/toaster";

export default function CardsPage() {
  const cards = useAppStore((s) => s.cards);
  const setCards = useAppStore((s) => s.setCards);
  const t = useTranslations("cards");
  const tc = useTranslations("common");

  return (
    <Page title={t("title")}>
      <CardList
        cards={cards}
        onAdd={(card) => {
          setCards([...cards, card]);
          void saveCard(db, card).catch((error: unknown) =>
            console.error("Could not save the card", error),
          );
          notify(tc("saved"));
        }}
        onDelete={(card) => {
          setCards(cards.filter((c) => c.id !== card.id));
          void removeCard(db, card.id).catch((error: unknown) =>
            console.error("Could not delete the card", error),
          );
          notifyUndo(tc("deletedItem", { name: card.label }), tc("undo"), () => {
            const current = useAppStore.getState();
            current.setCards([...current.cards, card]);
            void saveCard(db, card).catch((error: unknown) =>
              console.error("Could not restore the card", error),
            );
          });
        }}
      />
      <MinimumPaymentCalculator />
    </Page>
  );
}
