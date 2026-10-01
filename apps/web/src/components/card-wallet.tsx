"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, CreditCard, Plus } from "lucide-react";
import { BANKS, limitUsage, mainCards, type Card, type SupplementaryChoice } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CardDeleteDialog } from "./card-delete-dialog";
import { CardDetail } from "./card-detail";
import { CardForm } from "./card-form";
import { CardStack } from "./card-stack";
import { MinimumPaymentCalculator } from "./minimum-payment-calculator";
import { useBankName } from "./bank-card";

export interface CardWalletProps {
  cards: Card[];
  /** What is still to be paid on installment purchases, per card id. */
  remainingInstallments: Record<string, number>;
  currency: string;
  createId?: () => string;
  onSave: (card: Card) => void;
  onRemove: (card: Card, choice: SupplementaryChoice) => void;
}

type Panel =
  { kind: "detail"; cardId: string } | { kind: "form"; editing?: Card; parentId?: string } | null;

function BankSwatch({ bankId, onPick }: { bankId: string; onPick: () => void }) {
  const bank = BANKS.find((b) => b.id === bankId);
  const name = useBankName(bankId);
  if (!bank) return null;
  return (
    <button
      type="button"
      onClick={onPick}
      style={{ background: `linear-gradient(135deg, ${bank.from}, ${bank.to})`, color: bank.text }}
      className="flex h-12 items-center justify-center rounded-lg px-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {name}
    </button>
  );
}

export function CardWallet({
  cards,
  remainingInstallments,
  currency,
  createId = () => crypto.randomUUID(),
  onSave,
  onRemove,
}: CardWalletProps) {
  const t = useTranslations("cards");
  const [panel, setPanel] = useState<Panel>(null);
  const [deleting, setDeleting] = useState<Card | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [calculatorBalance, setCalculatorBalance] = useState<number | undefined>(undefined);
  const [presetBank, setPresetBank] = useState<string | undefined>(undefined);

  const detailCard =
    panel?.kind === "detail" ? cards.find((c) => c.id === panel.cardId) : undefined;
  const mains = mainCards(cards);

  function openMinimumOnly(card: Card) {
    const owed = (card.currentDebt ?? 0) + (remainingInstallments[card.id] ?? 0);
    setCalculatorBalance(owed > 0 ? owed : undefined);
    setToolsOpen(true);
    setPanel(null);
  }

  return (
    <div className="flex flex-col gap-8">
      {cards.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-8 w-8" />}
          title={t("empty.title")}
          description={t("empty.text")}
          action={
            <div className="flex w-full max-w-md flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                {BANKS.map((bank) => (
                  <BankSwatch
                    key={bank.id}
                    bankId={bank.id}
                    onPick={() => {
                      setPresetBank(bank.id);
                      setPanel({ kind: "form" });
                    }}
                  />
                ))}
              </div>
              <Button type="button" onClick={() => setPanel({ kind: "form" })}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("add")}
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => {
                setPresetBank(undefined);
                setPanel({ kind: "form" });
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("add")}
            </Button>
          </div>
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {mains.map((main) => {
              const usage = limitUsage(cards, main.id, remainingInstallments);
              return (
                <li key={main.id} className="flex flex-col gap-2">
                  <CardStack
                    main={main}
                    cards={cards}
                    onOpen={(card) => setPanel({ kind: "detail", cardId: card.id })}
                  />
                  {usage && (
                    <p className="text-xs text-muted-foreground" data-testid={`usage-${main.id}`}>
                      {usage.overLimit ? t("detail.overLimitShort") : t("detail.availableShort")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <section className="flex flex-col gap-3">
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          aria-expanded={toolsOpen}
          aria-controls="card-tools"
          onClick={() => setToolsOpen((open) => !open)}
        >
          {toolsOpen ? t("tools.hide") : t("tools.show")}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", toolsOpen && "rotate-180")}
            aria-hidden="true"
          />
        </Button>
        {toolsOpen && (
          <div id="card-tools">
            <MinimumPaymentCalculator
              key={calculatorBalance ?? "default"}
              {...(calculatorBalance !== undefined ? { initialBalance: calculatorBalance } : {})}
            />
          </div>
        )}
      </section>

      <Sheet open={panel !== null} onOpenChange={(open) => !open && setPanel(null)}>
        {panel?.kind === "form" && (
          <SheetContent
            title={
              panel.editing
                ? t("form.titleEdit")
                : panel.parentId
                  ? t("form.titleSupplementary")
                  : t("form.titleAdd")
            }
          >
            <CardForm
              key={panel.editing?.id ?? `${panel.parentId ?? "new"}-${presetBank ?? ""}`}
              {...(panel.editing ? { initial: panel.editing } : {})}
              {...(panel.parentId ? { parentId: panel.parentId } : {})}
              {...(presetBank && !panel.editing ? { initialBankId: presetBank } : {})}
              cards={cards}
              currency={currency}
              createId={createId}
              onSubmit={(card) => {
                onSave(card);
                setPanel(null);
              }}
              onCancel={() => setPanel(null)}
            />
          </SheetContent>
        )}
        {detailCard && (
          <SheetContent title={detailCard.label}>
            <CardDetail
              card={detailCard}
              cards={cards}
              remainingInstallments={remainingInstallments}
              onEdit={() => setPanel({ kind: "form", editing: detailCard })}
              onDelete={() => {
                setDeleting(detailCard);
                setPanel(null);
              }}
              onAddSupplementary={() => setPanel({ kind: "form", parentId: detailCard.id })}
              onMinimumOnly={() => openMinimumOnly(detailCard)}
            />
          </SheetContent>
        )}
      </Sheet>

      <CardDeleteDialog
        card={deleting}
        cards={cards}
        currency={currency}
        onCancel={() => setDeleting(null)}
        onConfirm={onRemove}
      />
    </div>
  );
}
