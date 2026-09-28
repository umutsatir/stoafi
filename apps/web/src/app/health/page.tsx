"use client";

import { useLocale, useTranslations } from "next-intl";
import { monthlyNeeds, project } from "@stoafi/core";
import { HealthMetrics } from "@/components/health-metrics";
import { getLessonCard } from "@/lessons";
import type { Locale } from "@/i18n/messages";
import { monthOf } from "@/lib/clock";
import { useAppStore } from "@/store";

export default function HealthPage() {
  const profile = useAppStore((s) => s.profile);
  const commitments = useAppStore((s) => s.commitments);
  const today = useAppStore((s) => s.today);
  const t = useTranslations("health");
  const locale = useLocale() as Locale;
  const roomForErrorLesson = getLessonCard("room-for-error", locale);

  if (!profile) {
    return (
      <main>
        <h1>{t("title")}</h1>
        <p>{t("fillProfileFirst")}</p>
      </main>
    );
  }

  const income = profile.incomes.reduce((sum, i) => sum + i.monthly, 0);
  const needs = monthlyNeeds(profile);
  const projection = project({ income }, commitments, monthOf(today));

  return (
    <main>
      <h1>{t("title")}</h1>
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
        >
          {roomForErrorLesson.title}
        </a>
      )}
    </main>
  );
}
