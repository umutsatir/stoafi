"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { Card } from "@stoafi/core";

export function CardList({ cards, onAdd }: { cards: Card[]; onAdd: (card: Card) => void }) {
  const [label, setLabel] = useState("");
  const [statementDay, setStatementDay] = useState(15);
  const [dueDay, setDueDay] = useState(5);
  const t = useTranslations("cards");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onAdd({ id: crypto.randomUUID(), label, statementDay, dueDay });
    setLabel("");
  }

  return (
    <div>
      <ul>
        {cards.map((card) => (
          <li key={card.id} data-testid={`card-${card.id}`}>
            {t("summary", {
              label: card.label,
              statementDay: card.statementDay,
              dueDay: card.dueDay,
            })}
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <label htmlFor="card-label">{t("label")}</label>
        <input id="card-label" value={label} onChange={(e) => setLabel(e.target.value)} />

        <label htmlFor="card-statement-day">{t("statementDay")}</label>
        <input
          id="card-statement-day"
          type="number"
          value={statementDay}
          onChange={(e) => setStatementDay(Number(e.target.value))}
        />

        <label htmlFor="card-due-day">{t("dueDay")}</label>
        <input
          id="card-due-day"
          type="number"
          value={dueDay}
          onChange={(e) => setDueDay(Number(e.target.value))}
        />

        <button type="submit">{t("add")}</button>
      </form>
    </div>
  );
}
