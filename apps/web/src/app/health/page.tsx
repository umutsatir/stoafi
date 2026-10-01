"use client";

import { useLocale, useTranslations } from "next-intl";
import { monthlyNeeds, project } from "@stoafi/core";
import { HealthMetrics } from "@/components/health-metrics";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";
import { monthOf } from "@/lib/clock";
import { useAppStore, useLedger } from "@/store";
import { Page } from "@/components/ui/page";

export default function HealthPage() {
  const profile = useAppStore((s) => s.profile);
  const commitments = useLedger();
  const today = useAppStore((s) => s.today);
  const t = useTranslations("health");
  const locale = useLocale() as Locale;
  const roomForErrorLesson = getLessonCard("room-for-error", locale);

  if (!profile) {
    return (
      <Page title={t("title")}>
        <p className="text-sm text-muted-foreground">{t("fillProfileFirst")}</p>
      </Page>
    );
  }

  const income = profile.incomes.reduce((sum, i) => sum + i.monthly, 0);
  const needs = monthlyNeeds(profile, monthOf(today));
  const projection = project({ income }, commitments, monthOf(today));

  return (
    <Page title={t("title")}>
      <HealthMetrics
        projection={projection}
        savingsBalance={profile.savings}
        monthlyNeeds={needs}
      />
      {roomForErrorLesson && (
        <a
          href={`#lesson-${roomForErrorLesson.id}`}
          aria-label={`${roomForErrorLesson.id} lesson`}
          data-testid="lesson-link-room-for-error"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          {roomForErrorLesson.title}
        </a>
      )}
    </Page>
  );
}
