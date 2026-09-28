"use client";

import { useState, type FormEvent } from "react";
import type { Card } from "@stoafi/core";

export function CardList({ cards, onAdd }: { cards: Card[]; onAdd: (card: Card) => void }) {
  const [label, setLabel] = useState("");
  const [statementDay, setStatementDay] = useState(15);
  const [dueDay, setDueDay] = useState(5);

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
            {card.label}: statement {card.statementDay}, due {card.dueDay}
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <label htmlFor="card-label">Label</label>
        <input id="card-label" value={label} onChange={(e) => setLabel(e.target.value)} />

        <label htmlFor="card-statement-day">Statement day</label>
        <input
          id="card-statement-day"
          type="number"
          value={statementDay}
          onChange={(e) => setStatementDay(Number(e.target.value))}
        />

        <label htmlFor="card-due-day">Due day</label>
        <input
          id="card-due-day"
          type="number"
          value={dueDay}
          onChange={(e) => setDueDay(Number(e.target.value))}
        />

        <button type="submit">Add card</button>
      </form>
    </div>
  );
}
