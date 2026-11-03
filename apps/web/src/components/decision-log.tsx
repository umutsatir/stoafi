"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { decisionStats, filterDecisions, type Decision } from "@stoafi/core";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn, stagger } from "@/lib/utils";
import { LessonLink } from "./lesson-link";

const OUTCOME_FILL: Record<Decision["outcome"], string> = {
  bought: "bg-c1",
  postponed: "bg-c2",
  skipped: "bg-c4",
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
  const [filter, setFilter] = useState<Decision["outcome"] | "all">("all");
  const stats = decisionStats(decisions, hourlyNetIncome);
  const rows = [...filterDecisions(decisions, filter)].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
        <Card className="pop-in bg-c4 px-[30px] py-[26px] text-on">
          <p className="text-[13px] font-bold">{t("stats.saved")}</p>
          <p
            data-testid="total-saved"
            className="mt-1 text-[clamp(36px,5vw,54px)] font-extrabold leading-[1.1] tracking-[-0.06em]"
          >
            <Money value={stats.saved} />
          </p>
          <p className="mt-1 text-[13px] font-semibold">
            {stats.savedWorkDays !== null && stats.saved > 0
              ? t("stats.savedWorkDays", { days: stats.savedWorkDays.toFixed(1) })
              : t("stats.savedCount", { count: stats.savedCount })}
          </p>
        </Card>
        <Card className="pop-in px-[30px] py-[26px]" style={stagger(1)}>
          <p className="text-[13px] font-bold text-muted-foreground">{t("stats.bought")}</p>
          <p
            data-testid="total-bought"
            className="mt-1 text-[34px] font-extrabold tracking-[-0.05em]"
          >
            <Money value={stats.bought} />
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {t("stats.boughtCount", { count: stats.boughtCount })}
          </p>
        </Card>
        <Card className="pop-in px-[30px] py-[26px]" style={stagger(2)}>
          <p className="text-[13px] font-bold text-muted-foreground">{t("stats.postponed")}</p>
          <p
            data-testid="total-postponed"
            className="mt-1 text-[34px] font-extrabold tracking-[-0.05em]"
          >
            {stats.postponedCount}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">{t("stats.postponedHint")}</p>
        </Card>
      </div>

      <SegmentedControl
        label={t("filter.label")}
        value={filter}
        onChange={setFilter}
        className="self-start"
        options={[
          { value: "all", label: t("filter.all") },
          { value: "bought", label: t("filter.bought") },
          { value: "postponed", label: t("filter.postponed") },
          { value: "skipped", label: t("filter.skipped") },
        ]}
      />

      <Card className="pop-in px-5 py-2.5 md:px-[30px]" style={stagger(3)}>
        {rows.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">{t("filter.none")}</p>
        ) : (
          <ul>
            {rows.map((d, rowIndex) => {
              const name = d.itemName ?? t("unknownItem");
              const acceptedRisk = (d.breachedRuleIds?.length ?? 0) > 0 && d.guardBreachConfirmed;
              return (
                <li
                  key={d.id}
                  data-testid={`decision-${d.id}`}
                  style={stagger(rowIndex)}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border py-[18px] last:border-b-0 [animation:slide_0.5s_backwards]"
                >
                  <span
                    data-testid={`outcome-${d.id}`}
                    className={cn(
                      "w-[92px] rounded-full px-3.5 py-1.5 text-center text-xs font-extrabold text-on",
                      OUTCOME_FILL[d.outcome],
                    )}
                  >
                    {t(`outcome.${d.outcome}`)}
                  </span>
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate text-base font-extrabold">{name}</p>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                      {d.timestamp.slice(0, 10)}
                      {acceptedRisk && (
                        <span data-testid={`risk-${d.id}`}> · {t("riskAccepted")}</span>
                      )}
                    </p>
                  </div>
                  <Money value={d.amount} className="text-base font-extrabold" />
                  {onAddBack && d.outcome !== "bought" && (
                    <button
                      type="button"
                      aria-label={t("addBackNamed", { name })}
                      onClick={() => onAddBack(d)}
                      className="press rounded-full bg-muted px-3.5 py-2 text-[12.5px] font-extrabold"
                    >
                      {t("addBack")}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      aria-label={t("deleteNamed", { name })}
                      onClick={() => onDelete(d)}
                      className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                    >
                      <X className="h-[15px] w-[15px]" aria-hidden="true" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <LessonLink lessonId="cost-in-life-energy" testId="lesson-link-decisions" />
    </div>
  );
}
