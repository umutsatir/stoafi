"use client";

import { useTranslations } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";
import { sinkingFundStatus, type Month, type SinkingFund } from "@stoafi/core";
import { useMoney } from "@/lib/use-money";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";

export interface SinkingFundListProps {
  funds: SinkingFund[];
  /** The current month; set-asides run from the next month to the due month. */
  month: Month;
  onEdit: (fund: SinkingFund) => void;
  onDelete: (fund: SinkingFund) => void;
}

export function SinkingFundList({ funds, month, onEdit, onDelete }: SinkingFundListProps) {
  const t = useTranslations("sinkingFunds");
  const money = useMoney();

  if (funds.length === 0) {
    return <EmptyState title={t("empty")} />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {funds.map((fund) => {
        const status = sinkingFundStatus(fund, month);
        const percent =
          fund.target > 0
            ? Math.min(100, Math.floor((fund.currentBalance / fund.target) * 100))
            : 100;

        return (
          <li key={fund.id}>
            <Card data-testid={`sinking-fund-${fund.id}`}>
              <CardContent className="flex flex-col gap-3 pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{fund.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("progress", {
                        saved: money(fund.currentBalance),
                        target: money(fund.target),
                        month: fund.dueMonth,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("edit", { name: fund.label })}
                      onClick={() => onEdit(fund)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("delete", { name: fund.label })}
                      onClick={() => onDelete(fund)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <ProgressBar
                  value={percent}
                  max={100}
                  label={t("progressLabel", { name: fund.label })}
                  tone={status.state === "overdue" ? "danger" : "primary"}
                />

                <p
                  data-testid={`sinking-status-${fund.id}`}
                  className={
                    status.state === "overdue" ? "text-sm font-medium text-destructive" : "text-sm"
                  }
                >
                  {status.state === "funded" && t("funded")}
                  {status.state === "active" &&
                    t("setAside", { amount: money(status.monthlySetAside), month: fund.dueMonth })}
                  {status.state === "due" && t("dueNow", { amount: money(status.missing) })}
                  {status.state === "overdue" &&
                    t("overdue", { month: fund.dueMonth, amount: money(status.missing) })}
                </p>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
