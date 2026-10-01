"use client";

import { useTranslations } from "next-intl";
import {
  addMonths,
  currentAllocation,
  netMonthlyIncome,
  projectSeries,
  strategyRegistry,
  type Commitment,
  type Insight,
  type Month,
  type PlanStateInput,
  type Profile,
} from "@stoafi/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { summarizeMonths } from "@/lib/months-summary";
import { LessonLink } from "./lesson-link";

/** Screen text for each insight id; an id without an entry falls back to the insight's English message. */
const MESSAGE_KEYS: Record<string, string> = {
  "fifty-thirty-twenty:wants-over-limit": "wantsOverLimit",
  "conscious-spending:guilt-free-over-limit": "guiltFreeOverLimit",
  "pay-yourself-first:savings-shortfall": "savingsShortfall",
  "baby-steps:step-1": "babyStepsStep1",
  "baby-steps:step-2": "babyStepsStep2",
  "baby-steps:step-3": "babyStepsStep3",
  "baby-steps:step-4": "babyStepsStep4",
};

export interface PlanInsightsProps {
  profile: Profile;
  planState: PlanStateInput;
  /** Recurring costs plus installments, so the projection matches what the user sees elsewhere. */
  ledger: Commitment[];
  month: Month;
  horizonMonths?: number;
}

/** What the active strategy has to say about the next months, one line per finding with its months. */
export function PlanInsights({
  profile,
  planState,
  ledger,
  month,
  horizonMonths = 12,
}: PlanInsightsProps) {
  const t = useTranslations("insights");
  const strategy = strategyRegistry[planState.strategyId];
  if (!strategy) return null;

  const months = Array.from({ length: horizonMonths }, (_, i) => addMonths(month, i));
  const projections = projectSeries({ income: netMonthlyIncome(profile) }, ledger, months, {
    bucketLimits: currentAllocation(profile, planState, strategyRegistry),
  });

  // One line per finding, listing every month it applies to, instead of twelve repeats.
  const byId = new Map<string, { insight: Insight; months: string[] }>();
  for (const insight of strategy.diagnose(profile, projections)) {
    const group = byId.get(insight.id) ?? { insight, months: [] };
    group.months.push(insight.month);
    byId.set(insight.id, group);
  }

  return (
    <Card data-testid="plan-insights">
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {byId.size === 0 ? (
          <p className="text-sm text-muted-foreground">{t("allClear")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {[...byId.entries()].map(([id, { insight, months: affected }]) => {
              const key = MESSAGE_KEYS[id];
              return (
                <li key={id} data-testid="plan-insight" className="text-sm">
                  {key ? t(key, { months: summarizeMonths(affected) }) : insight.message}
                </li>
              );
            })}
          </ul>
        )}
        <div>
          <LessonLink lessonId={strategy.lessonId} testId="lesson-link-plan-insights" />
        </div>
      </CardContent>
    </Card>
  );
}
