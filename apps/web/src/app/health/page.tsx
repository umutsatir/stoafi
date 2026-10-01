"use client";

import { useTranslations } from "next-intl";
import { monthlyNeeds, project } from "@stoafi/core";
import { HealthMetrics } from "@/components/health-metrics";
import { LessonLink } from "@/components/lesson-link";
import { monthOf } from "@/lib/clock";
import { useAppStore, useLedger } from "@/store";
import { Page } from "@/components/ui/page";

export default function HealthPage() {
  const profile = useAppStore((s) => s.profile);
  const commitments = useLedger();
  const today = useAppStore((s) => s.today);
  const t = useTranslations("health");

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
        emergencyFundTargetMonths={profile.emergencyFundTargetMonths}
      />
      <LessonLink lessonId="room-for-error" testId="lesson-link-room-for-error" />
    </Page>
  );
}
