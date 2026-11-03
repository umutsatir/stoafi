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
import { summarizeMonths } from "@/lib/months-summary";
import { useLocale } from "next-intl";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";
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
  const locale = useLocale() as Locale;
  const strategy = strategyRegistry[planState.strategyId];
  if (!strategy) return null;

  const lesson = getLessonCard(strategy.lessonId, locale);
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
    <section
      aria-label={t("title")}
      data-testid="plan-insights"
      className="lift pop-in flex h-full flex-col gap-1 rounded-card bg-card px-[30px] py-7"
    >
      <h2 className="text-[22px] font-extrabold tracking-[-0.03em]">{t("title")}</h2>
      {byId.size === 0 ? (
        <p className="mt-4 flex gap-3 text-sm font-semibold leading-[1.55]">
          <span
            aria-hidden="true"
            className="mt-[7px] h-2.5 w-2.5 flex-none rounded-full bg-success"
          />
          {t("allClear")}
        </p>
      ) : (
        <ul className="flex flex-col">
          {[...byId.entries()].map(([id, { insight, months: affected }]) => {
            const key = MESSAGE_KEYS[id];
            return (
              <li
                key={id}
                data-testid="plan-insight"
                className="mt-4 flex gap-3 text-sm font-semibold leading-[1.55] [animation:slide_0.5s_backwards]"
              >
                <span
                  aria-hidden="true"
                  className="mt-[7px] h-2.5 w-2.5 flex-none rounded-full bg-c1"
                />
                <span>{key ? t(key, { months: summarizeMonths(affected) }) : insight.message}</span>
              </li>
            );
          })}
        </ul>
      )}
      {lesson && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="rounded-[20px] bg-muted px-[18px] py-3.5 text-[13px] leading-[1.55]">
            <b>{t("idea")}</b> {lesson.principle}
          </div>
          <div className="rounded-[20px] bg-muted px-[18px] py-3.5 text-[13px] leading-[1.55]">
            <b>{t("fits")}</b> {lesson.fitsWhen}
          </div>
        </div>
      )}
      <div className="mt-auto pt-5">
        <LessonLink lessonId={strategy.lessonId} testId="lesson-link-plan-insights" />
      </div>
    </section>
  );
}
