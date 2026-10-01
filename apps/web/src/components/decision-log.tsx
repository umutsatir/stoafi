"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ListPlus, ShieldAlert, Trash2 } from "lucide-react";
import { decisionStats, filterDecisions, groupDecisionsByMonth, type Decision } from "@stoafi/core";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatCard } from "@/components/ui/stat-card";
import { StatusChip, type ChipTone } from "@/components/ui/status-chip";
import { formatMonth } from "@/lib/format-month";
import { LessonLink } from "./lesson-link";

const OUTCOME_TONE: Record<Decision["outcome"], ChipTone> = {
  bought: "info",
  postponed: "warning",
  skipped: "success",
};

export interface DecisionLogProps {
  decisions: Decision[];
  /** Minor units per hour; turns the money saved into work days. */
  hourlyNetIncome?: number;
  onDelete?: (decision: Decision) => void;
  /** Put a skipped or postponed item back in the queue. */
  onAddBack?: (decision: Decision) => void;
}

export function DecisionLog({ decisions, hourlyNetIncome, onDelete, onAddBack }: DecisionLogProps) {
  const t = useTranslations("decisions");
  const locale = useLocale();
  const [filter, setFilter] = useState<Decision["outcome"] | "all">("all");
  const stats = decisionStats(decisions, hourlyNetIncome);
  const groups = groupDecisionsByMonth(filterDecisions(decisions, filter));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("stats.saved")}
          value={<Money value={stats.saved} />}
          testId="total-saved"
          hint={
            stats.savedWorkDays !== null && stats.saved > 0
              ? t("stats.savedWorkDays", { days: stats.savedWorkDays.toFixed(1) })
              : t("stats.savedCount", { count: stats.savedCount })
          }
        />
        <StatCard
          label={t("stats.bought")}
          value={<Money value={stats.bought} />}
          testId="total-bought"
          hint={t("stats.boughtCount", { count: stats.boughtCount })}
        />
        <StatCard
          label={t("stats.postponed")}
          value={stats.postponedCount}
          testId="total-postponed"
          hint={t("stats.postponedHint")}
        />
      </div>

      <SegmentedControl
        label={t("filter.label")}
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: t("filter.all") },
          { value: "bought", label: t("filter.bought") },
          { value: "postponed", label: t("filter.postponed") },
          { value: "skipped", label: t("filter.skipped") },
        ]}
      />

      {groups.length === 0 && <p className="text-sm text-muted-foreground">{t("filter.none")}</p>}

      {groups.map((group) => (
        <section
          key={group.month}
          className="flex flex-col gap-2"
          data-testid={`month-${group.month}`}
        >
          <h2 className="text-sm font-semibold text-muted-foreground">
            {formatMonth(group.month, locale)}
          </h2>
          <ul className="flex flex-col gap-2">
            {group.decisions.map((d) => {
              const name = d.itemName ?? t("unknownItem");
              const acceptedRisk = (d.breachedRuleIds?.length ?? 0) > 0 && d.guardBreachConfirmed;
              return (
                <li
                  key={d.id}
                  data-testid={`decision-${d.id}`}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <StatusChip tone={OUTCOME_TONE[d.outcome]}>
                        <span data-testid={`outcome-${d.id}`}>{t(`outcome.${d.outcome}`)}</span>
                      </StatusChip>
                      <span>{d.timestamp.slice(0, 10)}</span>
                      {acceptedRisk && (
                        <span
                          data-testid={`risk-${d.id}`}
                          className="flex items-center gap-1 text-warning"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                          {t("riskAccepted")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Money value={d.amount} className="font-semibold" />
                  <div className="flex items-center gap-1">
                    {onAddBack && d.outcome !== "bought" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label={t("addBackNamed", { name })}
                        onClick={() => onAddBack(d)}
                      >
                        <ListPlus className="h-4 w-4" aria-hidden="true" />
                        {t("addBack")}
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("deleteNamed", { name })}
                        onClick={() => onDelete(d)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <LessonLink lessonId="cost-in-life-energy" testId="lesson-link-decisions" />
    </div>
  );
}
