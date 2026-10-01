"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import type { PotView } from "./pot-card";

export interface PotHistoryProps {
  pot: PotView;
  onDelete: (depositId: string) => void;
}

/** Every deposit and withdrawal of a pot, newest first, each one removable. */
export function PotHistory({ pot, onDelete }: PotHistoryProps) {
  const t = useTranslations("savings.history");
  const rows = [...pot.deposits].sort((a, b) => b.date.localeCompare(a.date));
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <ul className="flex flex-col divide-y divide-border" data-testid="pot-history">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center gap-3 py-3 text-sm">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{row.amount > 0 ? t("in") : t("out")}</p>
            <p className="text-xs text-muted-foreground">
              {row.date}
              {row.note ? ` · ${row.note}` : ""}
            </p>
          </div>
          <span className={row.amount > 0 ? "font-semibold text-success" : "font-semibold"}>
            {row.amount > 0 ? "+" : "−"}
            <Money value={Math.abs(row.amount)} />
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("delete", { date: row.date })}
            onClick={() => onDelete(row.id)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
