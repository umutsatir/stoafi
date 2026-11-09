"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { compareStrategies, strategyRegistry, type Profile } from "@stoafi/core";
import { LessonPanelLink } from "@/components/lesson-panel";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";
import { useMoney } from "@/lib/use-money";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const BUCKETS = ["needs", "wants", "savings", "investing"] as const;
const BUCKET_FILL: Record<(typeof BUCKETS)[number], string> = {
  needs: "bg-c1",
  wants: "bg-c2",
  savings: "bg-c4",
  investing: "bg-c3",
};

export interface PlanComparisonProps {
  profile: Profile;
  /** The saved plan's strategy id; its card shows as active. */
  activeStrategyId?: string;
  /** When given, each non-active card offers "Use this plan". */
  onSelect?: (strategyId: string) => void;
}

/** The four strategies side by side, each as one stacked bar of the month's money. */
export function PlanComparison({ profile, activeStrategyId, onSelect }: PlanComparisonProps) {
  const results = compareStrategies(profile, strategyRegistry);
  const t = useTranslations("plan");
  const locale = useLocale() as Locale;
  const money = useMoney();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Card className="pop-in px-5 py-7 md:px-8" style={{ animationDelay: "0.25s" }}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[22px] font-extrabold tracking-[-0.03em]">{t("chartTitle")}</h2>
          <ul className="flex flex-wrap gap-4 text-[12.5px] font-bold">
            {BUCKETS.map((bucket) => (
              <li key={bucket} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={cn("h-2.5 w-2.5 rounded-full", BUCKET_FILL[bucket])}
                />
                {t(bucket)}
              </li>
            ))}
          </ul>
        </div>

        {results.map(({ strategyId, allocation }) => {
          const strategy = strategyRegistry[strategyId];
          const lesson = strategy ? getLessonCard(strategy.lessonId, locale) : undefined;
          const isActive = activeStrategyId === strategyId;
          const total = BUCKETS.reduce((sum, b) => sum + allocation[b], 0) || 1;
          const expanded = open === strategyId;

          return (
            <section
              key={strategyId}
              aria-label={strategyId}
              data-testid={`strategy-${strategyId}`}
              className={cn(
                "mt-4 rounded-[20px] px-[22px] py-5 transition-all duration-300",
                isActive
                  ? "bg-muted shadow-[inset_0_0_0_2px_var(--primary)]"
                  : "bg-transparent shadow-[inset_0_0_0_1px_var(--border)]",
              )}
            >
              <div className="flex flex-wrap items-center gap-3.5">
                <div className="min-w-[12rem] flex-1">
                  <h3 className="text-[17px] font-extrabold tracking-[-0.02em]">
                    {lesson?.title ?? strategyId}
                  </h3>
                  {lesson && (
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                      {lesson.source.author}, {lesson.source.work}
                    </p>
                  )}
                </div>
                {lesson && (
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : strategyId)}
                    className="press rounded-full bg-muted px-3.5 py-2 text-[12.5px] font-extrabold"
                  >
                    {expanded ? t("hideLesson") : t("showLesson")}
                  </button>
                )}
                {onSelect &&
                  (isActive ? (
                    <button
                      type="button"
                      disabled
                      aria-pressed={true}
                      className="rounded-full bg-primary px-[18px] py-[9px] text-[13px] font-extrabold text-primary-foreground"
                    >
                      {t("activePlan")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelect(strategyId)}
                      className="press rounded-full bg-foreground px-[18px] py-[9px] text-[13px] font-extrabold text-background"
                    >
                      {t("usePlan")}
                    </button>
                  ))}
              </div>

              <div className="mt-3.5 flex h-[34px] gap-1" aria-hidden="true">
                {BUCKETS.map((bucket) => {
                  const share = allocation[bucket] / total;
                  return share > 0 ? (
                    <div
                      key={bucket}
                      className={cn(
                        "flex items-center justify-center overflow-hidden whitespace-nowrap rounded-[10px] text-xs font-extrabold text-on transition-[width] duration-500",
                        BUCKET_FILL[bucket],
                      )}
                      style={{ width: `${share * 100}%` }}
                    >
                      {share >= 0.07 ? `${Math.round(share * 100)}%` : ""}
                    </div>
                  ) : null;
                })}
              </div>
              <dl className="mt-2.5 flex flex-wrap gap-x-[18px] gap-y-1 text-[12.5px] font-semibold text-muted-foreground">
                {BUCKETS.map((bucket) => (
                  <div key={bucket} className="inline-flex items-center gap-[7px]">
                    <span
                      aria-hidden="true"
                      className={cn("h-2.5 w-2.5 flex-none rounded-full", BUCKET_FILL[bucket])}
                    />
                    <dt>{t(bucket)} -</dt>
                    <dd className="font-extrabold text-foreground">{money(allocation[bucket])}</dd>
                  </div>
                ))}
              </dl>

              {lesson && (
                <article
                  aria-label={`${strategyId} lesson`}
                  className={cn(
                    "mt-4 text-[13px] leading-relaxed [animation:fade_0.4s_backwards]",
                    expanded
                      ? "grid gap-[18px] md:grid-cols-[1.4fr_1fr_1fr]"
                      : "text-muted-foreground",
                  )}
                >
                  <div>
                    {expanded && <b>{t("idea")} </b>}
                    {lesson.principle}
                    <div>
                      <LessonPanelLink
                        lessonId={lesson.id}
                        ariaLabel={`${lesson.id} full lesson`}
                        className="mt-2 inline-block text-xs"
                      >
                        {t("readFullLesson")}
                      </LessonPanelLink>
                    </div>
                  </div>
                  {expanded && (
                    <>
                      <div>
                        <b>{t("fits")} </b>
                        {lesson.fitsWhen}
                      </div>
                      <div>
                        <b>{t("limits")} </b>
                        {lesson.critique}
                      </div>
                    </>
                  )}
                </article>
              )}
            </section>
          );
        })}
      </Card>

      <LessonPanelLink lessonId="index-funds" testId="lesson-link-index-funds" />
    </div>
  );
}
