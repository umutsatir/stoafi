"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Gem,
  History,
  Landmark,
  PiggyBank,
  Plane,
  Plus,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import { Money } from "@/components/ui/money";
import { PotVisual } from "@/components/ui/pot-visual";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusChip, type ChipTone } from "@/components/ui/status-chip";
import { formatMonth } from "@/lib/format-month";
import { useMoney } from "@/lib/use-money";
import { stagger } from "@/lib/utils";
import type { Deposit } from "@stoafi/core";

const ICONS: Record<string, LucideIcon> = {
  piggy: PiggyBank,
  shield: ShieldCheck,
  plane: Plane,
  gem: Gem,
  landmark: Landmark,
};

export interface PotView {
  id: string;
  kind: "emergency" | "goal";
  label: string;
  balance: number;
  target: number;
  dueMonth?: string;
  icon?: string;
  deposits: Deposit[];
  /** What this pot needs this month, and how much of that went in already. */
  neededThisMonth: number;
  depositedThisMonth: number;
  state: "funded" | "active" | "due" | "overdue" | "open";
  /** What the picture is measured against for a pot with no target (a month of needs). */
  openScale?: number;
}

export interface PotCardProps {
  pot: PotView;
  index: number;
  /** Changes when money goes into this pot; plays the coin animation. */
  dropKey: number;
  onDeposit: (pot: PotView) => void;
  onHistory: (pot: PotView) => void;
}

const STATE_TONE: Record<PotView["state"], ChipTone> = {
  funded: "success",
  active: "info",
  open: "info",
  due: "warning",
  overdue: "danger",
};

export function PotCard({ pot, index, dropKey, onDeposit, onHistory }: PotCardProps) {
  const t = useTranslations("savings");
  const locale = useLocale();
  const money = useMoney();
  const hasTarget = pot.target > 0;
  // No target to fill: the picture still grows with the balance, but never looks "full".
  const scale = Math.max(pot.openScale ?? 0, 1);
  const fraction = hasTarget
    ? pot.balance / pot.target
    : pot.balance > 0
      ? 0.3 + 0.65 * (1 - 1 / (1 + pot.balance / scale))
      : 0;
  const Icon = ICONS[pot.icon ?? (pot.kind === "emergency" ? "shield" : "piggy")] ?? PiggyBank;

  // Confetti when money just put in takes this pot past halfway or to its target.
  const previous = useRef(fraction);
  const [celebrate, setCelebrate] = useState(0);
  useEffect(() => {
    const crossedHalf = previous.current < 0.5 && fraction >= 0.5;
    const crossedFull = previous.current < 1 && fraction >= 1;
    if (hasTarget && (crossedHalf || crossedFull) && dropKey > 0) {
      setCelebrate((n) => n + 1);
    }
    previous.current = fraction;
  }, [fraction, dropKey, hasTarget]);

  return (
    <li
      data-testid={`pot-${pot.id}`}
      style={stagger(index)}
      className="rise-in relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      {celebrate > 0 && <Confetti key={celebrate} />}
      <div className="flex gap-4">
        <PotVisual fraction={fraction} icon={Icon} dropKey={dropKey} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold">{pot.label}</h3>
            <StatusChip tone={STATE_TONE[pot.state]}>
              <span data-testid={`pot-state-${pot.id}`}>{t(`state.${pot.state}`)}</span>
            </StatusChip>
          </div>
          <p className="mt-1 text-2xl font-semibold" data-testid={`pot-balance-${pot.id}`}>
            <Money value={pot.balance} animated />
          </p>
          <p className="text-sm text-muted-foreground">
            {hasTarget ? t("ofTarget", { target: money(pot.target) }) : t("noTarget")}
            {pot.dueMonth && ` · ${formatMonth(pot.dueMonth, locale)}`}
          </p>
        </div>
      </div>
      {hasTarget && (
        <ProgressBar
          value={Math.min(pot.balance, pot.target)}
          max={pot.target}
          label={t("progressLabel", { name: pot.label })}
          tone={pot.state === "overdue" ? "danger" : pot.state === "funded" ? "success" : "primary"}
        />
      )}
      {pot.neededThisMonth > 0 && (
        <p className="text-sm text-muted-foreground" data-testid={`pot-month-${pot.id}`}>
          {t("thisMonth", {
            added: money(pot.depositedThisMonth),
            needed: money(pot.neededThisMonth),
          })}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => onDeposit(pot)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("addMoney")}
          <span className="sr-only"> {pot.label}</span>
        </Button>
        <Button type="button" variant="outline" onClick={() => onHistory(pot)}>
          <History className="h-4 w-4" aria-hidden="true" />
          {t("historyButton")}
          <span className="sr-only"> {pot.label}</span>
        </Button>
      </div>
    </li>
  );
}
