"use client";

import { useTranslations } from "next-intl";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusChip } from "@/components/ui/status-chip";
import { useMoney } from "@/lib/use-money";

export interface InstallmentRoomProps {
  /** Net monthly income and the share of it installments may take (a setting). */
  income: number;
  capPct: number;
  /** What installments and loans cost this month. */
  used: number;
}

/** How much more monthly installment you can take on before reaching your own cap. */
export function InstallmentRoom({ income, capPct, used }: InstallmentRoomProps) {
  const t = useTranslations("home.installmentRoom");
  const money = useMoney();
  const cap = Math.round(income * capPct);
  const room = cap - used;
  const over = room < 0;
  const tight = !over && cap > 0 && used / cap > 0.85;

  return (
    <div className="flex flex-col gap-3" data-testid="installment-room">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">
          {t("cap", { pct: Math.round(capPct * 100), amount: money(cap) })}
        </span>
        <StatusChip tone={over ? "danger" : tight ? "warning" : "success"}>
          <span data-testid="installment-room-state">
            {over ? t("state.over") : tight ? t("state.tight") : t("state.ok")}
          </span>
        </StatusChip>
      </div>
      <ProgressBar
        value={used}
        max={cap}
        label={t("barLabel")}
        tone={over ? "danger" : tight ? "warning" : "primary"}
      />
      <p className="text-sm">
        <span
          data-testid="installment-room-left"
          className={over ? "font-semibold text-destructive" : "font-semibold"}
        >
          {over ? t("overBy", { amount: money(-room) }) : t("canTake", { amount: money(room) })}
        </span>
        <span className="text-muted-foreground"> {t("used", { amount: money(used) })}</span>
      </p>
    </div>
  );
}
