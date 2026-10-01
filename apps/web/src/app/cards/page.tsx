"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { remainingInstallmentsByCard, removeCardFromSet, type Card } from "@stoafi/core";
import { CardWallet } from "@/components/card-wallet";
import { notify, notifyUndo } from "@/components/ui/toaster";
import { Page } from "@/components/ui/page";
import { monthOf } from "@/lib/clock";
import { removeCard, saveCard } from "@/storage/card-repo";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";

function logFailure(what: string) {
  return (error: unknown) => console.error(`Could not ${what}`, error);
}

export default function CardsPage() {
  const cards = useAppStore((s) => s.cards);
  const setCards = useAppStore((s) => s.setCards);
  const queueItems = useAppStore((s) => s.queueItems);
  const currency = useAppStore((s) => s.currency);
  const today = useAppStore((s) => s.today);
  const t = useTranslations("cards");
  const tc = useTranslations("common");

  const remaining = useMemo(
    () => remainingInstallmentsByCard(queueItems, monthOf(today)),
    [queueItems, today],
  );

  function handleSave(card: Card) {
    const exists = cards.some((c) => c.id === card.id);
    setCards(exists ? cards.map((c) => (c.id === card.id ? card : c)) : [...cards, card]);
    void saveCard(db, card).catch(logFailure("save the card"));
    notify(tc("saved"));
  }

  function handleRemove(card: Card, choice: Parameters<typeof removeCardFromSet>[2]) {
    const result = removeCardFromSet(cards, card.id, choice);
    if (!result.ok) return;
    const before = cards;
    setCards(result.cards);
    for (const id of result.removedIds)
      void removeCard(db, id).catch(logFailure("delete the card"));
    // Supplementary cards kept as main cards changed, so they are saved again.
    for (const kept of result.cards) {
      const old = before.find((c) => c.id === kept.id);
      if (old && old !== kept) void saveCard(db, kept).catch(logFailure("save the card"));
    }
    notifyUndo(tc("deletedItem", { name: card.label }), tc("undo"), () => {
      useAppStore.getState().setCards(before);
      for (const c of before) void saveCard(db, c).catch(logFailure("restore the card"));
    });
  }

  return (
    <Page title={t("title")}>
      <CardWallet
        cards={cards}
        remainingInstallments={remaining}
        currency={currency}
        onSave={handleSave}
        onRemove={handleRemove}
      />
    </Page>
  );
}
