"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { HeartPulse } from "lucide-react";
import { depositedInMonth, healthSummary, monthlyNeeds, project } from "@stoafi/core";
import { HealthMetrics } from "@/components/health-metrics";
import { LessonLink } from "@/components/lesson-link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Page } from "@/components/ui/page";
import { monthOf } from "@/lib/clock";
import { useAppStore, useLedger } from "@/store";

export default function HealthPage() {
  const profile = useAppStore((s) => s.profile);
  const funds = useAppStore((s) => s.sinkingFunds);
  const guardThresholds = useAppStore((s) => s.guardThresholds);
  const commitments = useLedger();
  const today = useAppStore((s) => s.today);
  const t = useTranslations("health");

  if (!profile) {
    return (
      <Page title={t("title")}>
        <EmptyState
          icon={<HeartPulse className="h-8 w-8" />}
          title={t("empty.title")}
          description={t("fillProfileFirst")}
          action={
            <Button asChild>
              <Link href="/income-expenses">{t("empty.action")}</Link>
            </Button>
          }
        />
        <LessonLink lessonId="room-for-error" testId="lesson-link-room-for-error" />
      </Page>
    );
  }

  const month = monthOf(today);
  const income = profile.incomes.reduce((sum, i) => sum + i.monthly, 0);
  const projection = project({ income }, commitments, month);
  const depositedThisMonth =
    depositedInMonth(profile.deposits, month) +
    funds.reduce((sum, f) => sum + depositedInMonth(f.deposits, month), 0);
  const summary = healthSummary({
    projection,
    savingsBalance: profile.savings,
    monthlyNeeds: monthlyNeeds(profile, month),
    depositedThisMonth,
    emergencyFundTargetMonths: profile.emergencyFundTargetMonths,
    installmentCapPct: guardThresholds.installmentCapPct,
  });

  return (
    <Page title={t("title")}>
      <HealthMetrics
        summary={summary}
        emergencyFundTargetMonths={profile.emergencyFundTargetMonths}
        installmentCapPct={guardThresholds.installmentCapPct}
      />
      <LessonLink lessonId="room-for-error" testId="lesson-link-room-for-error" />
    </Page>
  );
}
