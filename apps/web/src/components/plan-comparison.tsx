"use client";

import { useLocale, useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
import { compareStrategies, strategyRegistry, type Profile } from "@stoafi/core";
import { LessonPanelLink } from "@/components/lesson-panel";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";
import { useMoney } from "@/lib/use-money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const BUCKET_COLORS = {
  needs: "var(--chart-needs)",
  wants: "var(--chart-wants)",
  savings: "var(--chart-savings)",
  investing: "var(--chart-investing)",
};

export interface PlanComparisonProps {
  profile: Profile;
  /** The saved plan's strategy id; its card shows as active. */
  activeStrategyId?: string;
  /** When given, each non-active card offers "Use this plan". */
  onSelect?: (strategyId: string) => void;
}

export function PlanComparison({ profile, activeStrategyId, onSelect }: PlanComparisonProps) {
  const results = compareStrategies(profile, strategyRegistry);
  const t = useTranslations("plan");
  const locale = useLocale() as Locale;
  const money = useMoney();

  const chartData = results.map(({ strategyId, allocation }) => {
    const strategy = strategyRegistry[strategyId];
    const lesson = strategy ? getLessonCard(strategy.lessonId, locale) : undefined;
    return { name: lesson?.title ?? strategyId, ...allocation };
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("chartTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <BarChart width={640} height={280} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value: number) =>
                (value / 100).toLocaleString(locale, { notation: "compact" })
              }
            />
            <Tooltip formatter={(value) => money(Number(value))} />
            <Legend />
            <Bar dataKey="needs" name={t("needs")} fill={BUCKET_COLORS.needs} />
            <Bar dataKey="wants" name={t("wants")} fill={BUCKET_COLORS.wants} />
            <Bar dataKey="savings" name={t("savings")} fill={BUCKET_COLORS.savings} />
            <Bar dataKey="investing" name={t("investing")} fill={BUCKET_COLORS.investing} />
          </BarChart>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {results.map(({ strategyId, allocation }) => {
          const strategy = strategyRegistry[strategyId];
          const lesson = strategy ? getLessonCard(strategy.lessonId, locale) : undefined;
          const isActive = activeStrategyId === strategyId;

          return (
            <Card
              key={strategyId}
              aria-label={strategyId}
              data-testid={`strategy-${strategyId}`}
              className={cn(isActive && "ring-2 ring-primary")}
            >
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base">{lesson?.title ?? strategyId}</CardTitle>
                {onSelect &&
                  (isActive ? (
                    <Button type="button" size="sm" disabled aria-pressed={true}>
                      {t("activePlan")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onSelect(strategyId)}
                    >
                      {t("usePlan")}
                    </Button>
                  ))}
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">{t("needs")}</dt>
                  <dd className="text-right font-medium">{money(allocation.needs)}</dd>
                  <dt className="text-muted-foreground">{t("wants")}</dt>
                  <dd className="text-right font-medium">{money(allocation.wants)}</dd>
                  <dt className="text-muted-foreground">{t("savings")}</dt>
                  <dd className="text-right font-medium">{money(allocation.savings)}</dd>
                  <dt className="text-muted-foreground">{t("investing")}</dt>
                  <dd className="text-right font-medium">{money(allocation.investing)}</dd>
                </dl>
                {lesson && (
                  <article
                    aria-label={`${strategyId} lesson`}
                    className="border-t border-border pt-3 text-sm text-muted-foreground"
                  >
                    <p>{lesson.principle}</p>
                    <footer className="mt-1 italic">
                      {lesson.source.author}, {lesson.source.work}
                    </footer>
                    <LessonPanelLink
                      lessonId={lesson.id}
                      ariaLabel={`${lesson.id} full lesson`}
                      className="mt-2 inline-block text-xs"
                    >
                      {t("readFullLesson")}
                    </LessonPanelLink>
                  </article>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <LessonPanelLink lessonId="index-funds" testId="lesson-link-index-funds" />
    </div>
  );
}
