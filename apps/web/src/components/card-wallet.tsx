"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CreditCard, Plus } from "lucide-react";
import { BANKS, cardColors, type Card, type SupplementaryChoice } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useQuickAction } from "@/lib/use-quick-action";
import { Money } from "@/components/ui/money";
import { cn } from "@/lib/utils";
import { CardDeleteDialog } from "./card-delete-dialog";
import { CardDetail } from "./card-detail";
import { CardForm } from "./card-form";
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

type Panel = { kind: "form"; editing?: Card; parentId?: string } | null;

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [calculatorBalance, setCalculatorBalance] = useState<number | undefined>(undefined);
  const [presetBank, setPresetBank] = useState<string | undefined>(undefined);
  useQuickAction("addCard", () => {
    setPresetBank(undefined);
    setPanel({ kind: "form" });
  });

  const selected = cards.find((c) => c.id === selectedId) ?? cards[0];
  const owedOn = (card: Card) => (card.currentDebt ?? 0) + (remainingInstallments[card.id] ?? 0);

  function openMinimumOnly(card: Card) {
    const owed = owedOn(card);
    setCalculatorBalance(owed > 0 ? owed : undefined);
  }

  return (
    <div className="flex flex-col gap-4">
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
          <ul className="-mx-4 flex gap-8 overflow-x-auto px-4 pb-8 pt-12 md:-mx-8 md:px-8">
            {cards.map((card, i) => {
              const colors = cardColors(card);
              const on = selected?.id === card.id;
              const supplementary = card.kind === "supplementary";
              const main = supplementary ? cards.find((c) => c.id === card.parentId) : undefined;
              return (
                <li key={card.id} className="flex-none">
                  <button
                    type="button"
                    data-testid={`card-${card.id}`}
                    aria-pressed={on}
                    aria-label={
                      main
                        ? t("openSupplementary", { name: card.label, main: main.label })
                        : t("openCard", { name: card.label })
                    }
                    onClick={() => setSelectedId(card.id)}
                    style={{
                      background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                      color: colors.text,
                      animationDelay: `${i * 80}ms`,
                    }}
                    className={cn(
                      "pop-in relative flex h-[208px] w-[300px] flex-col overflow-hidden rounded-[28px] px-[26px] py-6 text-left transition-[translate,rotate,scale,opacity,filter] duration-500 [transition-timing-function:cubic-bezier(.3,1.6,.5,1)] hover:z-[5] hover:-translate-y-4 hover:-rotate-2 hover:scale-[1.04] hover:opacity-100 hover:saturate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[330px]",
                      on
                        ? "z-[3] -translate-y-3.5 -rotate-[1.6deg] scale-[1.05] opacity-100"
                        : "scale-[.93] opacity-70 saturate-[.6]",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -right-[50px] -top-[50px] h-[170px] w-[170px] rounded-full bg-white/20"
                    />
                    <span className="relative flex items-start justify-between gap-2">
                      <span className="text-lg font-extrabold tracking-[-0.03em]">
                        {card.label}
                      </span>
                      {supplementary && (
                        <span className="rounded-full bg-white/40 px-2.5 py-1 text-[11px] font-extrabold">
                          {t("supplementaryBadge")}
                        </span>
                      )}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mt-[22px] h-[30px] w-[42px] rounded-lg bg-white/45"
                    />
                    <span className="relative mt-auto flex items-end justify-between gap-2">
                      <span>
                        <span className="block text-xs font-bold opacity-75">
                          <BankName bankId={card.bankId} />
                        </span>
                        <span className="mt-0.5 block text-[17px] font-extrabold tracking-[0.14em]">
                          •••• {card.last4 ?? "0000"}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block text-[11px] font-bold opacity-75">
                          {t("detail.usedLabel")}
                        </span>
                        <span className="block text-base font-extrabold">
                          <Money value={owedOn(card)} />
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected && (
            <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              <CardDetail
                card={selected}
                cards={cards}
                remainingInstallments={remainingInstallments}
                onEdit={() => setPanel({ kind: "form", editing: selected })}
                onDelete={() => setDeleting(selected)}
                onAddSupplementary={() => setPanel({ kind: "form", parentId: selected.id })}
                onMinimumOnly={() => openMinimumOnly(selected)}
              />
              <div id="card-tools" className="flex [&>*]:flex-1">
                <MinimumPaymentCalculator
                  key={calculatorBalance ?? "default"}
                  {...(calculatorBalance !== undefined
                    ? { initialBalance: calculatorBalance }
                    : {})}
                />
              </div>
            </div>
          )}
        </>
      )}

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
                setSelectedId(card.id);
                setPanel(null);
              }}
              onCancel={() => setPanel(null)}
            />
          </SheetContent>
        )}
      </Sheet>

      <CardDeleteDialog
        card={deleting}
        cards={cards}
        currency={currency}
        onCancel={() => setDeleting(null)}
        onConfirm={(card, choice) => {
          setSelectedId(null);
          onRemove(card, choice);
        }}
      />
    </div>
  );
}

function BankName({ bankId }: { bankId: string | undefined }) {
  return <>{useBankName(bankId)}</>;
}
