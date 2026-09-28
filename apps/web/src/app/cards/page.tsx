"use client";

import { CardList } from "@/components/card-list";
import { MinimumPaymentCalculator } from "@/components/minimum-payment-calculator";
import { useAppStore } from "@/store";

export default function CardsPage() {
  const cards = useAppStore((s) => s.cards);
  const setCards = useAppStore((s) => s.setCards);

  return (
    <main>
      <h1>Cards</h1>
      <CardList cards={cards} onAdd={(card) => setCards([...cards, card])} />
      <MinimumPaymentCalculator />
    </main>
  );
}
