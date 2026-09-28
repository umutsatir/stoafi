"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { CreditCard } from "lucide-react";
import type { Card as CardType } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DayOfMonthSelect } from "@/components/ui/day-of-month-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CardList({ cards, onAdd }: { cards: CardType[]; onAdd: (card: CardType) => void }) {
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
    <div className="flex flex-col gap-4">
      {cards.length > 0 && (
        <div className="flex flex-col gap-2">
          {cards.map((card) => (
            <Card key={card.id} data-testid={`card-${card.id}`}>
              <CardContent className="flex items-center gap-3 pt-6">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">
                  {t("summary", {
                    label: card.label,
                    statementDay: card.statementDay,
                    dueDay: card.dueDay,
                  })}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="card-label">{t("label")}</Label>
              <Input id="card-label" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="card-statement-day">{t("statementDay")}</Label>
              <DayOfMonthSelect
                id="card-statement-day"
                value={statementDay}
                onChange={setStatementDay}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="card-due-day">{t("dueDay")}</Label>
              <DayOfMonthSelect id="card-due-day" value={dueDay} onChange={setDueDay} />
            </div>

            <Button type="submit">{t("add")}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
