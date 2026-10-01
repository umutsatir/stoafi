"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { supplementariesOf, type Card, type SupplementaryChoice } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { MoneyInput } from "./money-input";

export interface CardDeleteDialogProps {
  /** The card to delete; null keeps the dialog closed. */
  card: Card | null;
  cards: Card[];
  currency: string;
  onCancel: () => void;
  /** Called with what to do with the supplementary cards (ignored if there are none). */
  onConfirm: (card: Card, choice: SupplementaryChoice) => void;
}

/** Asks before deleting a card; for a main card with supplementary cards, also what happens to them. */
export function CardDeleteDialog({
  card,
  cards,
  currency,
  onCancel,
  onConfirm,
}: CardDeleteDialogProps) {
  const t = useTranslations("cards");
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [keeping, setKeeping] = useState(false);
  const extras = card ? supplementariesOf(cards, card.id) : [];
  const ready = extras.every((e) => (limits[e.id] ?? 0) > 0);

  function close() {
    setKeeping(false);
    setLimits({});
    onCancel();
  }

  return (
    <Dialog open={card !== null} onOpenChange={(open) => !open && close()}>
      {card && (
        <DialogContent
          title={t("deleteDialog.title", { name: card.label })}
          description={extras.length > 0 ? t("deleteDialog.withExtras") : t("deleteDialog.plain")}
        >
          {keeping && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{t("deleteDialog.limitsHint")}</p>
              {extras.map((e) => (
                <Field
                  key={e.id}
                  label={t("deleteDialog.limitFor", { name: e.label })}
                  htmlFor={`limit-${e.id}`}
                >
                  <MoneyInput
                    id={`limit-${e.id}`}
                    currency={currency}
                    value={limits[e.id] ?? 0}
                    onChange={(minor) => setLimits((prev) => ({ ...prev, [e.id]: minor }))}
                  />
                </Field>
              ))}
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" autoFocus>
                {t("form.cancel")}
              </Button>
            </DialogClose>
            {extras.length > 0 && !keeping && (
              <Button type="button" variant="outline" onClick={() => setKeeping(true)}>
                {t("deleteDialog.keepSupplementary")}
              </Button>
            )}
            {keeping ? (
              <Button
                type="button"
                disabled={!ready}
                onClick={() => {
                  onConfirm(card, { supplementary: "detach", limits });
                  close();
                }}
              >
                {t("deleteDialog.deleteAndKeep")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onConfirm(card, { supplementary: "delete" });
                  close();
                }}
              >
                {extras.length > 0 ? t("deleteDialog.deleteAll") : t("deleteDialog.confirm")}
              </Button>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
