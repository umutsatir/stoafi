"use client";

import { useTranslations } from "next-intl";
import { bankById, cardColors, type Card } from "@stoafi/core";
import { cn } from "@/lib/utils";

const NETWORK_NAME: Record<NonNullable<Card["network"]>, string> = {
  visa: "VISA",
  mastercard: "Mastercard",
  troy: "Troy",
  amex: "AMEX",
  other: "",
};

/** The bank's name for display; the generic preset is translated, real banks keep their own name. */
export function useBankName(bankId: string | undefined): string {
  const t = useTranslations("cards");
  if (!bankId) return "";
  return bankId === "other" ? t("form.otherBank") : (bankById(bankId)?.name ?? "");
}

export interface BankCardProps {
  card: Pick<Card, "label" | "bankId" | "color" | "network" | "last4" | "kind">;
  onClick?: () => void;
  /** Spoken name for the button when the card can be opened. */
  ariaLabel?: string;
  /** Mark the selected card in a list. */
  selected?: boolean;
  className?: string;
}

/** A payment card drawn like a real one, in its bank's colours. */
export function BankCard({ card, onClick, ariaLabel, selected = false, className }: BankCardProps) {
  const t = useTranslations("cards");
  const colors = cardColors(card);
  const bank = useBankName(card.bankId);
  const network = card.network ? NETWORK_NAME[card.network] : "";
  const supplementary = card.kind === "supplementary";

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold tracking-wide opacity-90">{bank}</span>
        {supplementary && (
          <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs font-medium">
            {t("supplementaryBadge")}
          </span>
        )}
      </div>
      <div
        aria-hidden="true"
        className="mt-3 h-7 w-10 rounded-md bg-gradient-to-br from-white/70 to-white/30"
      />
      <div className="mt-auto flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{card.label}</p>
          <p className="font-mono text-sm tracking-widest opacity-90">
            {card.last4 ? `•••• ${card.last4}` : "•••• ••••"}
          </p>
        </div>
        <span className="text-sm font-bold italic opacity-90">{network}</span>
      </div>
    </>
  );

  const classes = cn(
    "relative flex aspect-[1.586] w-full max-w-sm flex-col rounded-2xl p-5 text-left shadow-md transition-transform",
    onClick &&
      "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    selected && "ring-2 ring-ring ring-offset-2",
    className,
  );
  const style = {
    background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
    color: colors.text,
  };

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={classes}
      style={style}
    >
      {body}
    </button>
  ) : (
    <div className={classes} style={style}>
      {body}
    </div>
  );
}
